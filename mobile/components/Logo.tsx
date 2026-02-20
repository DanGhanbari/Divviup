import React from 'react';
import Svg, { Rect, Path, G } from 'react-native-svg';

interface LogoProps {
    width?: number;
    height?: number;
}

export default function Logo({ width = 48, height = 48 }: LogoProps) {
    return (
        <Svg width={width} height={height} viewBox="0 0 55 55" fill="none">
            <G transform="translate(10, 5)">
                <Rect x="0" y="5" width="6" height="30" rx="3" fill="#343a40" />
                <Path d="M 12 35 C 12 35, 25 35, 35 20 L 42 12" stroke="#4f46e5" strokeWidth="6" strokeLinecap="round" />
                <Path d="M 12 5 C 12 5, 25 5, 32 15" stroke="#4f46e5" strokeWidth="6" strokeLinecap="round" />
            </G>
        </Svg>
    );
}
