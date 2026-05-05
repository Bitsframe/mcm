"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import { translationConstant } from '@/utils/translationConstants'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

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
      <SheetContent className="w-full max-w-md dark:bg-[#0e1725] m-3 rounded-lg dark:border-gray-700">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold dark:text-white">{t('Bonus_k16')}</SheetTitle>
        </SheetHeader>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">{t('Bonus_k17')}</label>
            <select
              id="filter-name-input-modal"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mt-1"
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
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300">{t('Bonus_k19')}</label>
              <input
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 mt-1"
                placeholder="Min"
                value={filterDraft.totalMin ?? ''}
                onChange={(e) => setFilterDraft((s: any) => ({ ...s, totalMin: e.target.value }))}
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300">{t('Bonus_k20')}</label>
              <input
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 mt-1"
                placeholder="Min"
                value={filterDraft.limitMin ?? ''}
                onChange={(e) => setFilterDraft((s: any) => ({ ...s, limitMin: e.target.value }))}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300">{t('Bonus_k21')}</label>
              <select
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mt-1"
                value={filterDraft.type ?? 'ALL'}
                onChange={(e) => setFilterDraft((s: any) => ({ ...s, type: e.target.value }))}
              >
                <option value="ALL">{t('Bonus_k28')}</option>
                <option value="FLAT">{t('Bonus_k34')}</option>
                <option value="PERCENTAGE">{t('Bonus_k35')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300">{t('Bonus_k22')}</label>
              <input
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 mt-1"
                placeholder="Min"
                value={filterDraft.valueMin ?? ''}
                onChange={(e) => setFilterDraft((s: any) => ({ ...s, valueMin: e.target.value }))}
                inputMode="numeric"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">{t('Bonus_k23')}</label>
            <input
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 mt-1"
              placeholder="Min"
              value={filterDraft.bonusMin ?? ''}
              onChange={(e) => setFilterDraft((s: any) => ({ ...s, bonusMin: e.target.value }))}
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">{t('Bonus_k24')}</label>
            <select
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mt-1"
              value={filterDraft.bonusEligibility ?? ''}
              onChange={(e) => setFilterDraft((s: any) => ({ ...s, bonusEligibility: e.target.value }))}
              aria-label="Filter by bonus eligibility"
            >
              <option value="">{t('Bonus_k29')}</option>
              <option value="yes">{t('Bonus_k30')}</option>
              <option value="no">{t('Bonus_k31')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">{t('Bonus_k25')}</label>
            <input
              type="date"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mt-1"
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
