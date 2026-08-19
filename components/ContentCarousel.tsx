
import React from 'react';
import { ContentItem } from '../types';
import ContentCard from './ContentCard';

interface ContentCarouselProps {
  title: string;
  items: ContentItem[];
}

const ContentCarousel: React.FC<ContentCarouselProps> = ({ title, items }) => {
  return (
    <section>
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-200">{title}</h2>
      <div className="relative">
        <div className="flex space-x-4 overflow-x-auto overflow-y-hidden py-2 scrollbar-hide">
          {items.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContentCarousel;
