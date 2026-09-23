"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import { translationConstant } from '@/utils/translationConstants'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

import { MacSelect } from "@/components/ui/mac-select";

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  filterDraft: Record<string, string>
  setFilterDraft: (updater: any) => void
  onApply: () => void
  onClear: () => void
  patients: any[]
  getYesterdayYMD: () => string
}

export default function BonusFilterSheet({ open, onOpenChange, filterDraft, setFilterDraft, onApply, onClear, patients, getYesterdayYMD }: Props) {
  const { t } = useTranslation(translationConstant.BONUS)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md m-3 rounded-lg">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold">{t('Bonus_k16')}</SheetTitle>
        </SheetHeader>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-700">{t('Bonus_k17')}</label>
            <MacSelect
              id="filter-name-input-modal"
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 mt-1"
              value={filterDraft.name ?? ''}
              onChange={(e) => setFilterDraft((s: any) => ({ ...s, name: e.target.value }))}
            >
              <option value="">{t('Bonus_k18')}</option>
              {patients && patients.map((p: any) => {
                const display = `${p.firstname || ''} ${p.lastname || ''} ${p.title || p.name || ''}`.trim()
                return (
                  <option key={String(p.id)} value={display}>{display || `Location ${p.id}`}</option>
                )
              })}
            </MacSelect>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700">{t('Bonus_k19')}</label>
              <input
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 placeholder-gray-500 mt-1"
                placeholder="Min"
                value={filterDraft.totalMin ?? ''}
                onChange={(e) => setFilterDraft((s: any) => ({ ...s, totalMin: e.target.value }))}
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">{t('Bonus_k20')}</label>
              <input
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 placeholder-gray-500 mt-1"
                placeholder="Min"
                value={filterDraft.limitMin ?? ''}
                onChange={(e) => setFilterDraft((s: any) => ({ ...s, limitMin: e.target.value }))}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700">{t('Bonus_k21')}</label>
              <MacSelect
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 mt-1"
                value={filterDraft.type ?? 'ALL'}
                onChange={(e) => setFilterDraft((s: any) => ({ ...s, type: e.target.value }))}
              >
                <option value="ALL">{t('Bonus_k28')}</option>
                <option value="FLAT">{t('Bonus_k34')}</option>
                <option value="PERCENTAGE">{t('Bonus_k35')}</option>
              </MacSelect>
            </div>
            <div>
              <label className="block text-sm text-gray-700">{t('Bonus_k22')}</label>
              <input
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 placeholder-gray-500 mt-1"
                placeholder="Min"
                value={filterDraft.valueMin ?? ''}
                onChange={(e) => setFilterDraft((s: any) => ({ ...s, valueMin: e.target.value }))}
                inputMode="numeric"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700">{t('Bonus_k23')}</label>
            <input
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 placeholder-gray-500 mt-1"
              placeholder="Min"
              value={filterDraft.bonusMin ?? ''}
              onChange={(e) => setFilterDraft((s: any) => ({ ...s, bonusMin: e.target.value }))}
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700">{t('Bonus_k24')}</label>
            <MacSelect
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 mt-1"
              value={filterDraft.bonusEligibility ?? ''}
              onChange={(e) => setFilterDraft((s: any) => ({ ...s, bonusEligibility: e.target.value }))}
              aria-label="Filter by bonus eligibility"
            >
              <option value="">{t('Bonus_k29')}</option>
              <option value="yes">{t('Bonus_k30')}</option>
              <option value="no">{t('Bonus_k31')}</option>
            </MacSelect>
          </div>

          <div>
            <label className="block text-sm text-gray-700">{t('Bonus_k25')}</label>
            <input
              type="date"
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 mt-1"
              value={filterDraft.date ?? ''}
              onChange={(e) => setFilterDraft((s: any) => ({ ...s, date: e.target.value }))}
              max={getYesterdayYMD()}
              aria-label="Filter by date (up to yesterday)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={onClear}>{t('Bonus_k26')}</Button>
            <Button size="sm" onClick={onApply}>{t('Bonus_k27')}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
