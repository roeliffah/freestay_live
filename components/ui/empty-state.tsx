import { AlertCircle, Search, Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  icon?: 'search' | 'alert' | 'package';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const icons = {
  search: Search,
  alert: AlertCircle,
  package: Package,
};

export function EmptyState({
  icon = 'package',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <Card className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="rounded-full bg-muted p-6 mb-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}

// Özel kullanım örnekleri
export function NoHotelsFound({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon="search"
      title="Otel Bulunamadı"
      description="Arama kriterlerinize uygun otel bulunamadı. Lütfen farklı tarihler veya destinasyon deneyin."
      actionLabel={onReset ? 'Aramayı Sıfırla' : undefined}
      onAction={onReset}
    />
  );
}

export function NoBookingsFound() {
  return (
    <EmptyState
      icon="package"
      title="Rezervasyon Bulunamadı"
      description="Henüz hiç rezervasyonunuz yok. Harika fırsatları kaçırmayın!"
    />
  );
}

export function ApiErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="alert"
      title="Bir Hata Oluştu"
      description="Veriler yüklenirken bir sorun oluştu. Lütfen tekrar deneyin."
      actionLabel={onRetry ? 'Tekrar Dene' : undefined}
      onAction={onRetry}
    />
  );
}
