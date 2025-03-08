import React, { useEffect, useRef } from 'react';
import { Animated, TextProps, Text } from 'react-native';

interface AnimatedTitleProps extends TextProps {
  children: string;
}

const AnimatedTitle: React.FC<AnimatedTitleProps> = ({ children, style, ...props }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [opacity, scale]);

  return (
    <Animated.Text style={[style, { opacity, transform: [{ scale }] }]} {...props}>
      {children}
    </Animated.Text>
  );
};

export default AnimatedTitle;
