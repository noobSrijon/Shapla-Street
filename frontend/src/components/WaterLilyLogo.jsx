const WaterLilyLogo = ({ className = "w-8 h-8", color = "currentColor" }) => {
    return (
        <svg 
            viewBox="0 0 100 100" 
            className={className}
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Center circle (flower center) */}
            <circle cx="50" cy="50" r="8" fill={color} opacity="0.9" />
            
            {/* Inner petals - 8 petals */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x = 50 + Math.cos(rad) * 15;
                const y = 50 + Math.sin(rad) * 15;
                const x2 = 50 + Math.cos(rad) * 5;
                const y2 = 50 + Math.sin(rad) * 5;
                
                return (
                    <ellipse
                        key={`inner-${i}`}
                        cx={x}
                        cy={y}
                        rx="8"
                        ry="14"
                        fill={color}
                        opacity="0.8"
                        transform={`rotate(${angle} ${x} ${y})`}
                    />
                );
            })}
            
            {/* Outer petals - 8 petals */}
            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x = 50 + Math.cos(rad) * 28;
                const y = 50 + Math.sin(rad) * 28;
                
                return (
                    <ellipse
                        key={`outer-${i}`}
                        cx={x}
                        cy={y}
                        rx="10"
                        ry="18"
                        fill={color}
                        opacity="0.6"
                        transform={`rotate(${angle} ${x} ${y})`}
                    />
                );
            })}
        </svg>
    );
};

export default WaterLilyLogo;
