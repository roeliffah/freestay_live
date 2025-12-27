'use client';

import { useState, useEffect } from 'react';
import { Select, Spin, Tag, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface Hotel {
  id: number;
  name: string;
  city: string;
  country: string;
  stars: number;
}

interface HotelSelectorProps {
  value: number[];
  onChange: (ids: number[]) => void;
}

export default function HotelSelector({ value, onChange }: HotelSelectorProps) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async (search?: string) => {
    try {
      setLoading(true);
      const url = search
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/featured-hotels?stars=5&count=50`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/featured-hotels?stars=5&count=20`;
        
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        const hotelsData = result.hotels || [];
        setHotels(hotelsData);
      }
    } catch (error) {
      console.error('Error loading hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2) {
      loadHotels(value);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Select Hotels</label>
      <Select
        mode="multiple"
        value={value}
        onChange={onChange}
        placeholder="Search and select hotels"
        loading={loading}
        onSearch={handleSearch}
        filterOption={false}
        className="w-full"
        suffixIcon={<SearchOutlined />}
        notFoundContent={loading ? <Spin size="small" /> : <Empty description="No hotels found" />}
        maxTagCount={3}
      >
        {hotels.map((hotel) => (
          <Select.Option key={hotel.id} value={hotel.id}>
            <div>
              <div className="font-medium">{hotel.name}</div>
              <div className="text-xs text-gray-500">
                {hotel.city}, {hotel.country} • {hotel.stars}★
              </div>
            </div>
          </Select.Option>
        ))}
      </Select>
      
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((id) => {
            const hotel = hotels.find(h => h.id === id);
            return hotel ? (
              <Tag key={id} closable onClose={() => onChange(value.filter(v => v !== id))}>
                {hotel.name}
              </Tag>
            ) : (
              <Tag key={id} color="red">
                Hotel ID: {id}
              </Tag>
            );
          })}
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2">
        Selected: {value.length} hotel{value.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
