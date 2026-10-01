import { HStack, Text, VStack } from '@expo/ui/swift-ui';
import { background, cornerRadius, font, foregroundStyle, padding, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type MonthExpensesWidgetProps = {
  amountLabel: string;
  monthLabel: string;
  subtitle: string;
};

const MonthExpensesWidgetLayout = (
  props: MonthExpensesWidgetProps,
  _environment: WidgetEnvironment,
) => {
  'widget';
  const bg = '#F8FAFB';
  const text = '#0D1B2A';
  const muted = '#6B7A8F';
  const soft = '#E8F4F2';
  const brand = '#FF4500';
  const amount = props.amountLabel || '$0.00';
  const month = props.monthLabel || '';
  const subtitle = props.subtitle || 'Spent this month';

  return (
    <VStack
      modifiers={[
        background(bg),
        padding({ all: 14 }),
        widgetURL('worthy://transactions'),
      ]}
    >
      <HStack modifiers={[padding({ bottom: 8 })]}>
        <VStack modifiers={[background(soft), cornerRadius(10), padding({ all: 6 })]}>
          <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle(brand)]}>−</Text>
        </VStack>
      </HStack>
      <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(muted)]}>
        {subtitle}
      </Text>
      <Text modifiers={[font({ size: 22, weight: 'semibold' }), foregroundStyle(text)]}>
        {amount}
      </Text>
      <Text modifiers={[font({ size: 10, weight: 'regular' }), foregroundStyle(muted)]}>
        {month}
      </Text>
    </VStack>
  );
};

const MonthExpensesWidget = createWidget('MonthExpensesWidget', MonthExpensesWidgetLayout);
export default MonthExpensesWidget;
