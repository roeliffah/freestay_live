'use client';

import { useState } from 'react';
import { Tabs, Input, Button } from 'antd';
import { BoldOutlined, ItalicOutlined, UnderlineOutlined, LinkOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface HTMLEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function HTMLEditor({ value, onChange }: HTMLEditorProps) {
  const [activeTab, setActiveTab] = useState('html');

  const insertTag = (tag: string) => {
    const wrappedText = `<${tag}>${tag}</${tag}>`;
    onChange(value + wrappedText);
  };

  return (
    <div className="border rounded">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="small"
        className="px-2 pt-2"
      >
        <TabPane tab="</> HTML Code" key="html">
          <div className="mb-2 flex gap-2 flex-wrap">
            <Button size="small" onClick={() => insertTag('h2')}>
              H2
            </Button>
            <Button size="small" onClick={() => insertTag('h3')}>
              H3
            </Button>
            <Button size="small" onClick={() => insertTag('p')}>
              Paragraph
            </Button>
            <Button size="small" icon={<BoldOutlined />} onClick={() => insertTag('strong')}>
              Bold
            </Button>
            <Button size="small" icon={<ItalicOutlined />} onClick={() => insertTag('em')}>
              Italic
            </Button>
            <Button size="small" onClick={() => insertTag('div')}>
              Div
            </Button>
            <Button size="small" onClick={() => onChange(value + '<br/>')}>
              Line Break
            </Button>
          </div>
          
          <TextArea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={12}
            className="font-mono text-sm"
            placeholder="<div class='text-center py-16'>
  <h2 class='text-3xl font-bold mb-4'>Your Heading</h2>
  <p class='text-gray-600'>Your content here...</p>
  <button class='bg-blue-500 text-white px-6 py-2 rounded'>Call to Action</button>
</div>"
          />
          
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
            <p className="font-semibold">💡 Quick Tips:</p>
            <p>• Use Tailwind CSS classes: text-3xl, font-bold, py-16, bg-blue-500, etc.</p>
            <p>• Responsive: md:grid-cols-2, lg:text-4xl, sm:px-4</p>
            <p>• Colors: text-gray-600, bg-blue-500, border-red-300</p>
          </div>
        </TabPane>
        
        <TabPane tab="👁️ Preview" key="preview">
          <div 
            className="p-6 border rounded bg-white min-h-[300px]"
            dangerouslySetInnerHTML={{ __html: value }}
          />
          <p className="text-xs text-gray-500 mt-2">
            Preview of how your HTML will appear on the homepage
          </p>
        </TabPane>

        <TabPane tab="📋 Examples" key="examples">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold mb-1">Centered Section with CTA</p>
              <Button 
                size="small" 
                onClick={() => onChange(`<div class="text-center py-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
  <h2 class="text-4xl font-bold mb-4">Special Offer</h2>
  <p class="text-xl mb-6">Book now and save up to 50%</p>
  <a href="/search" class="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
    Browse Deals
  </a>
</div>`)}
              >
                Use This Template
              </Button>
            </div>

            <div>
              <p className="text-sm font-semibold mb-1">Feature Grid</p>
              <Button 
                size="small" 
                onClick={() => onChange(`<div class="py-16 bg-gray-50">
  <div class="container mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="text-center">
        <div class="text-5xl mb-4">🏨</div>
        <h3 class="text-xl font-semibold mb-2">Best Hotels</h3>
        <p class="text-gray-600">Handpicked luxury accommodations</p>
      </div>
      <div class="text-center">
        <div class="text-5xl mb-4">💰</div>
        <h3 class="text-xl font-semibold mb-2">Best Prices</h3>
        <p class="text-gray-600">Guaranteed lowest rates</p>
      </div>
      <div class="text-center">
        <div class="text-5xl mb-4">⭐</div>
        <h3 class="text-xl font-semibold mb-2">Top Rated</h3>
        <p class="text-gray-600">4.9/5 customer satisfaction</p>
      </div>
    </div>
  </div>
</div>`)}
              >
                Use This Template
              </Button>
            </div>

            <div>
              <p className="text-sm font-semibold mb-1">Promo Banner</p>
              <Button 
                size="small" 
                onClick={() => onChange(`<div class="py-12 bg-yellow-400 text-center">
  <p class="text-2xl font-bold text-gray-800">
    🎉 Limited Time: 25% OFF on all bookings! Use code: <span class="bg-black text-yellow-400 px-3 py-1 rounded">SUMMER25</span>
  </p>
</div>`)}
              >
                Use This Template
              </Button>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
}
