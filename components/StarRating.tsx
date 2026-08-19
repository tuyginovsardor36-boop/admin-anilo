import React from 'react';
import { StarIcon } from './icons/StarIcon';

interface StarRatingProps {
  rating: number;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating }) => {
  return (
    <div className="flex items-center" aria-label={`Rating: ${rating} out of 5 stars`}>
      {[...Array(5)].map((_, index) => {
        const value = index + 1;
        const fillPercentage =
          value <= rating
            ? 100
            : value - 1 < rating
            ? Math.round((rating % 1) * 100)
            : 0;

        return (
          <div key={index} className="relative w-5 h-5 flex-shrink-0">
            {/* Background (empty) star */}
            <StarIcon className="absolute text-gray-700" />
            
            {/* Filled star part */}
            <div
              className="absolute h-full overflow-hidden"
              style={{ width: `${fillPercentage}%` }}
            >
              <StarIcon className="text-yellow-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
};