/**
 * Secure Form Component - Tüm güvenlik önlemlerini içeren form wrapper
 * Tüm formlarda tutarlı güvenlik sağlar
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Form, FormInstance, Alert } from 'antd';
import { FormProps } from 'antd/es/form';
import { ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { rateLimiter, formRateLimiter } from '@/lib/security/rate-limiter';
import { initCsrfProtection } from '@/lib/security/csrf-protection';
import { createHoneypot, validateHoneypot, honeypotClassName } from '@/lib/security/honeypot';

interface SecureFormProps extends Omit<FormProps, 'children'> {
  onSecureFinish: (values: any) => Promise<void> | void;
  identifier?: string; // Rate limiting için unique identifier (email, username, vb.)
  enableRateLimit?: boolean;
  enableHoneypot?: boolean;
  enableCsrf?: boolean;
  customRateLimitConfig?: {
    maxAttempts: number;
    windowMs: number;
    blockDurationMs: number;
  };
  children?: React.ReactNode;
}

/**
 * Güvenli Form Component
 * 
 * Özellikler:
 * - Rate limiting
 * - Honeypot bot tespiti
 * - CSRF protection
 * - Otomatik error handling
 * 
 * Kullanım:
 * ```tsx
 * <SecureForm
 *   identifier={email} // Rate limiting için
 *   onSecureFinish={handleSubmit}
 *   enableRateLimit={true}
 *   enableHoneypot={true}
 * >
 *   <Form.Item name="email">
 *     <Input />
 *   </Form.Item>
 * </SecureForm>
 * ```
 */
export default function SecureForm({
  onSecureFinish,
  identifier = 'default',
  enableRateLimit = true,
  enableHoneypot = true,
  enableCsrf = true,
  customRateLimitConfig,
  children,
  ...formProps
}: SecureFormProps): React.JSX.Element {
  const [form] = Form.useForm();
  const [honeypot] = useState(createHoneypot());
  const [blocked, setBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState<number | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // CSRF protection
  useEffect(() => {
    if (enableCsrf) {
      initCsrfProtection();
    }
  }, [enableCsrf]);

  // Block timer
  useEffect(() => {
    if (blockTime) {
      const timer = setInterval(() => {
        const now = Date.now();
        if (now >= blockTime) {
          setBlocked(false);
          setBlockTime(null);
          setRemainingAttempts(null);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [blockTime]);

  const handleFinish = useCallback(
    async (values: any) => {
      // Honeypot kontrolü
      if (enableHoneypot) {
        const botCheck = validateHoneypot(values.website || '', honeypot.timestamp);
        if (botCheck.isBot) {
          console.warn('Bot detected:', botCheck.reason);
          form.setFields([
            {
              name: 'general',
              errors: ['Invalid request. Please try again.'],
            },
          ]);
          return;
        }
      }

      // Rate limiting kontrolü
      if (enableRateLimit) {
        const rateLimitConfig = customRateLimitConfig || formRateLimiter;
        const rateCheck = rateLimiter.check(identifier, rateLimitConfig);

        if (!rateCheck.allowed) {
          setBlocked(true);
          setBlockTime(rateCheck.resetTime || 0);
          const minutesLeft = Math.ceil((rateCheck.resetTime! - Date.now()) / 60000);
          form.setFields([
            {
              name: 'general',
              errors: [
                `Too many attempts! Please try again in ${minutesLeft} minute(s).`,
              ],
            },
          ]);
          return;
        }

        // Kalan deneme hakkını göster
        if (rateCheck.remainingAttempts < 3) {
          setRemainingAttempts(rateCheck.remainingAttempts);
        }
      }

      setSubmitting(true);
      try {
        await onSecureFinish(values);

        // Başarılı - rate limiter'ı sıfırla
        if (enableRateLimit) {
          rateLimiter.reset(identifier);
          setRemainingAttempts(null);
        }
      } catch (error: any) {
        console.error('Form submission error:', error);
        
        // Hata durumunda kalan hakkı güncelle
        if (enableRateLimit) {
          const newCheck = rateLimiter.check(identifier, customRateLimitConfig || formRateLimiter);
          if (newCheck.remainingAttempts < 3) {
            setRemainingAttempts(newCheck.remainingAttempts);
          }
        }

        form.setFields([
          {
            name: 'general',
            errors: [error.message || 'An error occurred. Please try again.'],
          },
        ]);
      } finally {
        setSubmitting(false);
      }
    },
    [
      enableHoneypot,
      enableRateLimit,
      honeypot,
      identifier,
      customRateLimitConfig,
      onSecureFinish,
      form,
    ]
  );

  const getBlockMessage = () => {
    if (!blockTime) return '';
    const minutesLeft = Math.ceil((blockTime - Date.now()) / 60000);
    return `Form temporarily locked. Please try again in ${minutesLeft} minute(s).`;
  };

  return (
    <>
      {/* Honeypot styles */}
      {enableHoneypot && (
        <style jsx global>{`
          .${honeypotClassName} {
            position: absolute !important;
            left: -9999px !important;
            width: 1px !important;
            height: 1px !important;
            opacity: 0 !important;
            pointer-events: none !important;
            tab-index: -1 !important;
          }
        `}</style>
      )}

      {/* Rate Limit Alerts */}
      {blocked && (
        <Alert
          title="Form Locked"
          description={getBlockMessage()}
          type="error"
          icon={<ClockCircleOutlined />}
          showIcon
          className="mb-4"
          closable
        />
      )}

      {!blocked && remainingAttempts !== null && remainingAttempts < 3 && (
        <Alert
          title="Warning"
          description={`Remaining attempts: ${remainingAttempts}`}
          type="warning"
          icon={<WarningOutlined />}
          showIcon
          className="mb-4"
          closable
          onClose={() => setRemainingAttempts(null)}
        />
      )}

      <Form
        {...formProps}
        form={form}
        onFinish={handleFinish}
        disabled={blocked || submitting || formProps.disabled}
      >
        {children}
      </Form>
    </>
  );
}
