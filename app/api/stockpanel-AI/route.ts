import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

let isProcessingRunning = false;

export async function GET() {
  try {
    if (isProcessingRunning) {
      console.log(" Processing already in progress, skipping this request");
      return NextResponse.json(
        { 
          message: "Processing already in progress. Please wait for current batch to complete.", 
          status: "in_progress" 
        },
        { status: 409 }
      );
    }

    isProcessingRunning = true;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
    const batchSize = 100;
    let offset = 0;
    let totalProcessed = 0;
    let batchNumber = 1;

    const { count, error: countError } = await supabase
      .from("inventory")
      .select("*", { count: "exact", head: true })
      .eq("archived", false);

    if (countError) {
      console.error(" Error fetching inventory count:", countError);
      isProcessingRunning = false;
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    console.log(` Processing will run in batches of ${batchSize} items each`);

    while (true) {
      console.log(`\n Starting Batch ${batchNumber} (offset: ${offset})...`);

      const { data: inventory, error: inventoryError } = await supabase
        .from("inventory")
        .select("*")
        .eq("archived", false)
        .range(offset, offset + batchSize - 1);

      if (inventoryError) {
        console.error(" Error fetching inventory:", inventoryError);
        isProcessingRunning = false;
        return NextResponse.json(
          { error: inventoryError.message },
          { status: 500 }
        );
      }

      if (!inventory || inventory.length === 0) {
        console.log(" All inventory items processed! No more batches needed.");
        break;
      }


      const inventoryIds = inventory.map((i) => i.inventory_id);
      const { data: allSales } = await supabase
        .from("sales_history")
        .select("inventory_id, quantity_sold, date_sold")
        .in("inventory_id", inventoryIds);

      const allAlertsArray: any[] = [];

      const aiBatchItems = inventory
        .map((item) => {
          const sales = allSales?.filter(
            (s) => s.inventory_id === item.inventory_id
          );
          const totalSold =
            sales?.reduce((sum, s) => sum + (s.quantity_sold || 0), 0) || 0;

          let salesVelocity = 0.01;
          if (sales && sales.length > 0 && totalSold > 0) {
            const dates = sales
              .map((s) => new Date(s.date_sold))
              .sort((a, b) => a.getTime() - b.getTime());
            const daysBetween = Math.max(
              1,
              Math.ceil(
                (dates[dates.length - 1].getTime() - dates[0].getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            );
            salesVelocity = totalSold / daysBetween;
          }

          return {
            inventory_id: item.inventory_id,
            product_id: item.product_id,
            location_id: item.location_id,
            current_stock: item.quantity,
            total_sold: totalSold,
            sales_velocity: salesVelocity,
          };
        })
        .filter((i) => i.total_sold > 0); 

      let aiPredictions: Record<
        string,
        { months_until_stockout: number; quantity_needed: number }
      > = {};

      if (aiBatchItems.length > 0) {
        console.log(` Calling AI for ${aiBatchItems.length} items with sales history...`);
        
        const aiPrompt = `You are an inventory forecasting AI. For each item, return ONLY JSON with inventory_id, months_until_stockout, quantity_needed.\nItems: ${JSON.stringify(
          aiBatchItems
        )}`;

        try {
          const aiResponse = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: aiPrompt }],
                temperature: 0.1,
                max_tokens: 5000,
              }),
            }
          );

          const aiData = await aiResponse.json();
          const text = aiData?.choices?.[0]?.message?.content || null;
          if (text) {
            const parsed = JSON.parse(text.replace(/```json|```/g, ""));
            parsed.forEach((p: any) => {
              aiPredictions[p.inventory_id] = {
                months_until_stockout: p.months_until_stockout,
                quantity_needed: p.quantity_needed,
              };
            });
            console.log(`✅ AI predictions received for ${Object.keys(aiPredictions).length} items`);
          }
        } catch (err) {
          console.error("❌ AI batch error:", err);
        }
      }

      inventory.forEach((item) => {
        const sales = allSales?.filter(
          (s) => s.inventory_id === item.inventory_id
        );
        const totalSold =
          sales?.reduce((sum, s) => sum + (s.quantity_sold || 0), 0) || 0;

        let salesVelocity = 0.01;
        if (sales && sales.length > 0 && totalSold > 0) {
          const dates = sales
            .map((s) => new Date(s.date_sold))
            .sort((a, b) => a.getTime() - b.getTime());
          const daysBetween = Math.max(
            1,
            Math.ceil(
              (dates[dates.length - 1].getTime() - dates[0].getTime()) /
                (1000 * 60 * 60 * 24)
            )
          );
          salesVelocity = totalSold / daysBetween;
        }

        const leadTime = 7;
        const bufferStock = 5;
        const threshold = Math.ceil(salesVelocity * leadTime + bufferStock);

        let forecastedRunoutMonths: number | null = null;
        let requiredQty: number | null = 0;

        if (totalSold > 0 && aiPredictions[item.inventory_id]) {
          forecastedRunoutMonths =
            Math.min(aiPredictions[item.inventory_id].months_until_stockout, 60) ||
            null;
          requiredQty = aiPredictions[item.inventory_id].quantity_needed || 0;
        } else if (totalSold > 0) {
          const runoutDays =
            salesVelocity > 0 ? Math.floor(item.quantity / salesVelocity) : null;
          forecastedRunoutMonths = runoutDays
            ? Math.min(Math.round(runoutDays / 30), 60)
            : null;
        }

        let priority = "Healthy";
        if (item.quantity <= threshold) priority = "Critical";
        else if (item.quantity <= threshold * 1.5) priority = "Warning";

        let anomalyType = null;
        let anomalySeverity = "Normal";
        let anomalyMessage = null;

        if (totalSold === 0 && item.quantity > 0) {
          anomalyType = "dead_stock";
          anomalySeverity = "Warning";
          anomalyMessage = `No sales recorded but ${item.quantity} units remain in stock.`;
        }

        const message = `Product ${item.product_id} at location ${item.location_id} status: ${priority}. Current stock: ${item.quantity}, Total sales: ${totalSold}, Threshold: ${Math.round(threshold)}, Forecasted runout: ${forecastedRunoutMonths ?? "N/A"} months. Recommended order qty: ${requiredQty ? Math.round(requiredQty) : "N/A"}`;

         allAlertsArray.push({
           inventory_id: item.inventory_id,
           product_id: item.product_id,
           location_id: item.location_id,
           quantity: Math.round(item.quantity),
           threshold: Math.round(threshold),
           forecasted_runout_months:
             typeof forecastedRunoutMonths === "number"
               ? Math.round(forecastedRunoutMonths)
               : null,
           priority,
           message,
           anomaly_type: anomalyType,
           anomaly_severity: anomalySeverity,
           anomaly_message: anomalyMessage,
           created_at: new Date().toISOString(),
         });
      });

      await supabase.from("stock_alerts").delete().in("inventory_id", inventoryIds);

      const { error: insertError } = await supabase
        .from("stock_alerts")
        .insert(allAlertsArray);
      
      if (insertError) {
        console.error(" Error inserting alerts:", insertError);
      } else {
        console.log(`✅ Successfully inserted ${allAlertsArray.length} alerts`);
      }

      totalProcessed += inventory.length;
      console.log(`✅ Batch ${batchNumber} completed! Items processed: ${inventory.length}`);
      //@ts-ignore
      console.log(`📊 Progress: ${totalProcessed}/${count} items processed (${Math.round((totalProcessed/count)*100)}%)`);

      offset += batchSize;
      batchNumber++;

      if (inventory.length < batchSize) {
        console.log(" Last batch completed - all inventory items processed!");
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    isProcessingRunning = false;
    
    console.log(` Processing COMPLETED! Total batches: ${batchNumber-1}, Total items: ${totalProcessed}`);
    
    return NextResponse.json(
      { 
        message: "Processing completed successfully", 
        totalProcessed,
        totalBatches: batchNumber - 1,
        status: "completed"
      },
      { status: 200 }
    );

  } catch (err: any) {
    isProcessingRunning = false;
    
    return NextResponse.json({ 
      error: err.message,
      status: "error"
    }, { status: 500 });
  }
}