import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type Props = { uri: string };

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const RESET_ANIMATION_DURATION = 200;

export function ZoomableImage({ uri }: Props) {
  const scale = useSharedValue(MIN_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const baseScale = useSharedValue(MIN_SCALE);
  const baseTranslateX = useSharedValue(0);
  const baseTranslateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(baseScale.value * event.scale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd((event) => {
      baseScale.value = Math.min(Math.max(baseScale.value * event.scale, MIN_SCALE), MAX_SCALE);
      scale.value = baseScale.value;
      if (baseScale.value === MIN_SCALE) {
        baseTranslateX.value = 0;
        baseTranslateY.value = 0;
        translateX.value = 0;
        translateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (baseScale.value <= MIN_SCALE) return;
      translateX.value = baseTranslateX.value + event.translationX;
      translateY.value = baseTranslateY.value + event.translationY;
    })
    .onEnd((event) => {
      if (baseScale.value <= MIN_SCALE) return;
      baseTranslateX.value += event.translationX;
      baseTranslateY.value += event.translationY;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const isZoomedIn = baseScale.value > MIN_SCALE;
      baseScale.value = isZoomedIn ? MIN_SCALE : DOUBLE_TAP_SCALE;
      baseTranslateX.value = 0;
      baseTranslateY.value = 0;
      scale.value = withTiming(baseScale.value, { duration: RESET_ANIMATION_DURATION });
      translateX.value = withTiming(0, { duration: RESET_ANIMATION_DURATION });
      translateY.value = withTiming(0, { duration: RESET_ANIMATION_DURATION });
    });

  const composedGesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Animated.Image source={{ uri }} style={styles.image} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
});
