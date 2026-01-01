
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal } from 'react-native';
import { useTutorial } from './TutorialProvider';
import { colors } from '../../theme/tokens';
import { Button } from '../Button';
import { useColorScheme } from 'nativewind';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function TutorialOverlay() {
    const { currentStep, activeLayout, nextStep, skipTutorial, isActive } = useTutorial();
    const { colorScheme } = useColorScheme();
    const palette = colorScheme === 'dark' ? colors.dark : colors.light;

    if (!isActive || !currentStep) return null;

    // If we don't have a layout yet (e.g. screen transition happening), we can either 
    // show a loader or just wait (transparent). 
    // To avoid flashing, let's wait until activeLayout is ready before showing the "Spotlight".
    // Or we show a generic modal in center if layout takes too long? 
    // For now, let's render nothing until we lock onto the target.
    // If activeLayout is missing, we show the tooltip in the center of the screen
    // This serves as a fallback so the tutorial doesn't appear "broken" or invisible.

    // Default values if layout is missing (Center screen)
    const x = activeLayout ? activeLayout.x : SCREEN_WIDTH / 2;
    const y = activeLayout ? activeLayout.y : SCREEN_HEIGHT / 2;
    const width = activeLayout ? activeLayout.width : 0;
    const height = activeLayout ? activeLayout.height : 0;
    const hasLayout = !!activeLayout;

    // Calculate spotlight hole surroundings (only if we have a layout)
    // If no layout, we make the whole screen dark backdrop.

    const topHeight = hasLayout ? Math.max(0, y) : SCREEN_HEIGHT / 2; // Split half
    const bottomHeight = hasLayout ? Math.max(0, SCREEN_HEIGHT - (y + height)) : SCREEN_HEIGHT / 2;
    // ... Actually, cleaner: if no layout, just one full backdrop.

    const isBottomHalf = y > SCREEN_HEIGHT / 2;
    // If fallback, put tooltip in a nice spot (e.g. center)
    const tooltipTop = hasLayout
        ? (isBottomHalf ? (y - 180) : (y + height + 20))
        : (SCREEN_HEIGHT / 2 - 100); // Centered roughly

    return (
        <Modal transparent visible animationType="none">
            <View style={StyleSheet.absoluteFill}>
                {/* Backdrop */}
                {hasLayout ? (
                    <>
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Math.max(0, y), backgroundColor: 'rgba(0,0,0,0.7)' }} />
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: Math.max(0, SCREEN_HEIGHT - (y + height)), backgroundColor: 'rgba(0,0,0,0.7)' }} />
                        <View style={{ position: 'absolute', top: Math.max(0, y), left: 0, width: Math.max(0, x), height: height, backgroundColor: 'rgba(0,0,0,0.7)' }} />
                        <View style={{ position: 'absolute', top: Math.max(0, y), right: 0, width: Math.max(0, SCREEN_WIDTH - (x + width)), height: height, backgroundColor: 'rgba(0,0,0,0.7)' }} />
                    </>
                ) : (
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }} />
                )}

                {/* Highlight Border (Only if has layout) */}
                {hasLayout && (
                    <View
                        style={{
                            position: 'absolute',
                            top: y - 4,
                            left: x - 4,
                            width: width + 8,
                            height: height + 8,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: palette.brand,
                            backgroundColor: 'transparent'
                        }}
                    />
                )}

                {/* Tooltip Card */}
                <Animated.View
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(200)}
                    style={[
                        styles.card,
                        {
                            top: tooltipTop,
                            backgroundColor: palette.surface,
                            shadowColor: '#000',
                        }
                    ]}
                >
                    <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 18, color: palette.text, marginBottom: 8 }}>
                        {currentStep.title}
                    </Text>
                    <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 15, color: palette.muted, marginBottom: 20, lineHeight: 22 }}>
                        {currentStep.description}
                    </Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                        <Button title="Skip" onPress={skipTutorial} variant="ghost" />
                        <Button title="Next" onPress={nextStep} variant="primary" />
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

// Dummy export to keep file valid structure before splicing
const _unused = null;

const styles = StyleSheet.create({
    card: {
        position: 'absolute',
        left: 20,
        right: 20,
        padding: 20,
        borderRadius: 20,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    }
});
