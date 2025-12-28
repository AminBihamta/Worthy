
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
    if (!activeLayout) return null;

    // Safe destructuring
    const { x, y, width, height } = activeLayout;

    // Calculate spotlight hole surroundings
    // Top rect
    const topHeight = Math.max(0, y);
    // Bottom rect
    const bottomHeight = Math.max(0, SCREEN_HEIGHT - (y + height));
    // Left rect (beside the hole)
    const leftWidth = Math.max(0, x);
    // Right rect
    const rightWidth = Math.max(0, SCREEN_WIDTH - (x + width));

    // Tooltip positioning
    // Prefer below the target, unless too close to bottom
    const isBottomHalf = y > SCREEN_HEIGHT / 2;
    const tooltipTop = isBottomHalf ? (y - 180) : (y + height + 20);

    return (
        <Modal transparent visible animationType="none">
            <View style={StyleSheet.absoluteFill}>
                {/* Backdrop constructed of 4 views to create a hole */}
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: topHeight, backgroundColor: 'rgba(0,0,0,0.7)' }} />
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: bottomHeight, backgroundColor: 'rgba(0,0,0,0.7)' }} />
                <View style={{ position: 'absolute', top: topHeight, left: 0, width: leftWidth, height: height, backgroundColor: 'rgba(0,0,0,0.7)' }} />
                <View style={{ position: 'absolute', top: topHeight, right: 0, width: rightWidth, height: height, backgroundColor: 'rgba(0,0,0,0.7)' }} />

                {/* Highlight Border (Optional) */}
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
