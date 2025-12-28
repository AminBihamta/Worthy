
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LayoutRectangle, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '../../state/useSettingsStore';

export type TutorialTargetId =
    | 'home_balance'
    | 'home_actions'
    | 'home_transactions_list'
    | 'transactions_header'
    | 'budgets_screen'
    | 'goals_screen'
    | 'insights_screen';

type TutorialStep = {
    id: string;
    targetId: TutorialTargetId;
    title: string;
    description: string;
    screenName: string; // To auto-navigate
};

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: '1',
        targetId: 'home_balance',
        title: 'Track Your Wealth',
        description: 'See your total wealth in your base currency. This combines all your Cash, Bank, and Investment accounts.',
        screenName: 'Home',
    },
    {
        id: '2',
        targetId: 'home_actions',
        title: 'Quick Actions',
        description: 'Log new Expenses, Income, or Transfers specifically from here.',
        screenName: 'Home',
    },
    {
        id: '3',
        targetId: 'home_transactions_list',
        title: 'Recent Activity',
        description: 'Your latest transactions appear here for quick review.',
        screenName: 'Home',
    },
    // We can add cross-screen steps later or now. Let's stick to Home first as per original request, 
    // BUT user asked to "introduce transactions page, budgets, goals".
    // Let's add simple navigation steps.
    {
        id: '4',
        targetId: 'transactions_header',
        title: 'Transactions Module',
        description: 'Dive deep into your history, filter by date, category, or account.',
        screenName: 'TransactionsStack',
    },
    // For Budgets/Goals/Insights which are tabs, we need to navigate to those tabs.
    // Assuming standard Tab names.
];

type TutorialContextType = {
    currentStep: TutorialStep | null;
    registerTarget: (id: TutorialTargetId, layout: LayoutRectangle) => void;
    unregisterTarget: (id: TutorialTargetId) => void;
    activeLayout: LayoutRectangle | null;
    nextStep: () => void;
    skipTutorial: () => void;
    isActive: boolean;
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
    const { hasSeenTutorial, completeTutorial } = useSettingsStore();
    const navigation = useNavigation<any>();

    // We start tutorial only if !hasSeenTutorial
    // And maybe wait a bit for initial render?
    const [stepIndex, setStepIndex] = useState(0);
    const [targets, setTargets] = useState<Record<string, LayoutRectangle>>({});

    const isActive = !hasSeenTutorial;
    const currentStep = isActive && TUTORIAL_STEPS[stepIndex] ? TUTORIAL_STEPS[stepIndex] : null;

    // Auto-navigate when step changes
    useEffect(() => {
        if (currentStep) {
            // Slight delay to allow UI to settle or previous screen to unmount
            setTimeout(() => {
                // Basic navigation attempt. 
                // Note: 'Home' might be inside a Tab logic. 
                // If screenName matches a Tab route, navigate there.
                try {
                    navigation.navigate(currentStep.screenName);
                } catch (e) {
                    console.warn("Tutorial navigation failed", e);
                }
            }, 500);
        }
    }, [currentStep?.id, navigation]);

    const registerTarget = useCallback((id: TutorialTargetId, layout: LayoutRectangle) => {
        setTargets(prev => {
            // Optimization: Avoid update if layout is practically same
            const existing = prev[id];
            if (existing &&
                Math.abs(existing.x - layout.x) < 1 &&
                Math.abs(existing.y - layout.y) < 1 &&
                Math.abs(existing.width - layout.width) < 1 &&
                Math.abs(existing.height - layout.height) < 1
            ) {
                return prev;
            }
            return { ...prev, [id]: layout };
        });
    }, []);

    const unregisterTarget = useCallback((id: TutorialTargetId) => {
        setTargets(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    const finish = useCallback(() => {
        completeTutorial();
    }, [completeTutorial]);

    const nextStep = useCallback(() => {
        setStepIndex(prev => {
            if (prev < TUTORIAL_STEPS.length - 1) {
                return prev + 1;
            }
            // If we are at the end, finish
            // Note: This side effect inside setter might be slightly risky but setStepIndex is standard.
            // Better to handle "finish" check outside or in effect, but for now specific check:
            // Actually, better logic:
            return prev;
        });
        // We only increment if valid. If equal to length-1, we call finish.
        // It's cleaner to read state but here safely:
        if (stepIndex < TUTORIAL_STEPS.length - 1) {
            setStepIndex(prev => prev + 1);
        } else {
            finish();
        }
    }, [stepIndex, finish]);


    const activeLayout = currentStep && targets[currentStep.targetId] ? targets[currentStep.targetId] : null;

    const contextValue = useMemo(() => ({
        currentStep,
        registerTarget,
        unregisterTarget,
        activeLayout,
        nextStep,
        skipTutorial: finish,
        isActive
    }), [currentStep, registerTarget, unregisterTarget, activeLayout, nextStep, finish, isActive]);

    return (
        <TutorialContext.Provider value={contextValue}>
            {children}
        </TutorialContext.Provider>
    );
}

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (!context) throw new Error("useTutorial must be used within TutorialProvider");
    return context;
};

export const useTutorialTarget = (id: TutorialTargetId) => {
    const { registerTarget, unregisterTarget, isActive } = useTutorial();
    const viewRef = useRef<View>(null);

    useEffect(() => {
        if (!isActive) return;

        // Measurement function
        const measure = () => {
            viewRef.current?.measureInWindow((x, y, width, height) => {
                if (width > 0 && height > 0) {
                    registerTarget(id, { x, y, width, height });
                }
            });
        };

        // Measure on mount and potentially on layout updates
        // We can use a timeout or interaction manager
        const timer = setTimeout(measure, 500); // Wait for nav animations

        return () => {
            clearTimeout(timer);
            unregisterTarget(id);
        };
    }, [id, isActive, registerTarget, unregisterTarget]);

    return {
        ref: viewRef,
        onLayout: () => {
            if (!isActive) return;
            viewRef.current?.measureInWindow((x, y, width, height) => {
                registerTarget(id, { x, y, width, height });
            });
        }
    };
};
