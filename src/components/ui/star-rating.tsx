import React, { useState } from "react";

interface StarRatingProps {
  rating: number;
  size?: number;
  onRatingChange: (newRating: number) => void;
  color?: {
    filled: string;
    empty: string;
  };
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 20,
  onRatingChange,
  color = {
    filled: "#f5a623", // Yellow
    empty: "#d4d4d4", // Gray
  },
}) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating" style={{ display: "flex", gap: "4px" }}>
      {[...Array(5)].map((_, index) => {
        // The value of this star (from 1 to 5)
        const starValue = index + 1;

        // Decide whether the star should be "filled"
        // Prioritize hover first, if no hover, use rating
        const isFilled = starValue <= (hover || rating);

        return (
          <span
            key={starValue}
            style={{
              cursor: "pointer",
              fontSize: `${size}px`,
              color: isFilled ? color.filled : color.empty,
              transition: "color 0.2s", // Smooth transition
            }}
            // When clicked, call the callback function to update state in the parent component
            onClick={() => onRatingChange(starValue)}
            // On mouse enter, update the hover state
            onMouseEnter={() => setHover(starValue)}
            // On mouse leave, reset the hover state
            onMouseLeave={() => setHover(0)}
          >
            ★ {/* Star character */}
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;
