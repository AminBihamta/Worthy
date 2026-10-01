import { HStack, Text, VStack } from '@expo/ui/swift-ui';
import { background, cornerRadius, font, foregroundStyle, padding, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type QuickAddExpenseWidgetProps = {
  title: string;
  subtitle: string;
};

const QuickAddExpenseWidgetLayout = (
  props: QuickAddExpenseWidgetProps,
  _environment: WidgetEnvironment,
) => {
  'widget';
  const bg = '#F8FAFB';
  const text = '#0D1B2A';
  const muted = '#6B7A8F';
  const brand = '#FF4500';
  const title = props.title || 'Add expense';
  const subtitle = props.subtitle || 'Tap to log spending';

  return (
    <VStack
      modifiers={[
        background(bg),
        padding({ all: 14 }),
        widgetURL('worthy://add-expense'),
      ]}
    >
      <HStack modifiers={[padding({ bottom: 10 })]}>
        <VStack modifiers={[background(brand), cornerRadius(16), padding({ all: 10 })]}>
          <Text modifiers={[font({ size: 18, weight: 'bold' }), foregroundStyle('#FFFFFF')]}>+</Text>
        </VStack>
      </HStack>
      <Text modifiers={[font({ size: 16, weight: 'semibold' }), foregroundStyle(text)]}>
        {title}
      </Text>
      <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(muted)]}>
        {subtitle}
      </Text>
    </VStack>
  );
};

const QuickAddExpenseWidget = createWidget('QuickAddExpenseWidget', QuickAddExpenseWidgetLayout);
export default QuickAddExpenseWidget;
