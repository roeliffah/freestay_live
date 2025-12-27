'use client';

import { useState, useEffect } from 'react';
import { Select, Spin, Tag, Empty } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

interface Destination {
  id: number;
  name: string;
  country: string;
  hotelCount: number;
}

interface DestinationSelectorProps {
  value: number[];
  onChange: (ids: number[]) => void;
}

export default function DestinationSelector({ value, onChange }: DestinationSelectorProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/popular-destinations?count=50`
      );
      if (response.ok) {
        const result = await response.json();
        const destinationsData = result.destinations || [];
        setDestinations(destinationsData);
      }
    } catch (error) {
      console.error('Error loading destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Select Destinations</label>
      <Select
        mode="multiple"
        value={value}
        onChange={onChange}
        placeholder="Select destinations"
        loading={loading}
        className="w-full"
        suffixIcon={<GlobalOutlined />}
        notFoundContent={loading ? <Spin size="small" /> : <Empty description="No destinations found" />}
        maxTagCount={3}
      >
        {destinations.map((dest) => (
          <Select.Option key={dest.id} value={dest.id}>
            <div>
              <div className="font-medium">{dest.name}</div>
              <div className="text-xs text-gray-500">
                {dest.country} • {dest.hotelCount} hotels
              </div>
            </div>
          </Select.Option>
        ))}
      </Select>
      
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((id) => {
            const dest = destinations.find(d => d.id === id);
            return dest ? (
              <Tag key={id} closable onClose={() => onChange(value.filter(v => v !== id))}>
                {dest.name}
              </Tag>
            ) : (
              <Tag key={id} color="red">
                Destination ID: {id}
              </Tag>
            );
          })}
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2">
        Selected: {value.length} destination{value.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
