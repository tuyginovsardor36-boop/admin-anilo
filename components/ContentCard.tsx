
import React from 'react';
import { ContentItem } from '../types';

interface ContentCardProps {
  item: ContentItem;
}

const ContentCard: React.FC<ContentCardProps> = ({ item }) => {
  return (
    <div className="group relative flex-shrink-0 w-40 md:w-52 cursor-pointer">
      <div className="overflow-hidden rounded-lg shadow-lg transform transition-transform duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-purple-500/30">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-auto object-cover aspect-[2/3]"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
      </div>
    </div>
  );
};

export default ContentCard;
