"use client";
import { useState } from "react";
import { login } from "@/actions/supabase_auth/action";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { Loader2 } from "lucide-react";

function Login({ searchParams }: { searchParams: { error_message: string } }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    // Wait for the server action to process the form submission
    await login(new FormData(event.currentTarget));

    setLoading(false);
  };

  return (
    <main className="h-screen w-full flex">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-[450px]">
          <CardHeader className="text-center">
            <h1 className="text-xl font-bold">Login</h1>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Email"
                className="w-full"
              />

              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Password"
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <IoEyeOff size={22} /> : <IoEye size={22} />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary_color text-white disabled:opacity-70 hover:opacity-90 active:opacity-80"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin text-white" size={20} />
                ) : (
                  "Login"
                )}
              </Button>

              {searchParams?.error_message && (
                <p className="mt-4 p-4 bg-red-600/10 w-full rounded-xl text-red-600 text-foreground border-[1px] border-red-600/25">
                  {searchParams.error_message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default Login;
