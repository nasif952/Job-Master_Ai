'use client'

import React from 'react'
import { validatePasswordStrength } from '@/lib/security'
import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password: string
  className?: string
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = validatePasswordStrength(password)
  
  if (!password) return null

  const getStrengthColor = (score: number) => {
    if (score >= 6) return 'text-green-600 dark:text-green-400'
    if (score >= 4) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 2) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getStrengthBars = (score: number) => {
    const bars = []
    for (let i = 0; i < 4; i++) {
      let barColor = 'bg-gray-200 dark:bg-gray-700'
      
      if (i < score / 2) {
        if (score >= 6) barColor = 'bg-green-500'
        else if (score >= 4) barColor = 'bg-yellow-500'
        else if (score >= 2) barColor = 'bg-orange-500'
        else barColor = 'bg-red-500'
      }
      
      bars.push(
        <div
          key={i}
          className={cn('h-1 w-full rounded-full transition-colors', barColor)}
        />
      )
    }
    return bars
  }

  const getStrengthText = (score: number) => {
    if (score >= 6) return 'Strong'
    if (score >= 4) return 'Good'
    if (score >= 2) return 'Fair'
    return 'Weak'
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength bars */}
      <div className="flex space-x-1">
        {getStrengthBars(strength.score)}
      </div>
      
      {/* Strength text */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Password strength:</span>
        <span className={cn('font-medium', getStrengthColor(strength.score))}>
          {getStrengthText(strength.score)}
        </span>
      </div>
      
      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((feedback, index) => (
            <div
              key={index}
              className={cn(
                'text-xs flex items-center',
                strength.isStrong 
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              <span className="mr-2">
                {strength.isStrong ? '✓' : '•'}
              </span>
              {feedback}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 