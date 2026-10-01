import { HStack, Text, VStack } from '@expo/ui/swift-ui';
import { background, cornerRadius, font, foregroundStyle, padding, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type BalanceWidgetProps = {
  amountLabel: string;
  subtitle: string;
};

const BalanceWidgetLayout = (props: BalanceWidgetProps, _environment: WidgetEnvironment) => {
  'widget';
  const bg = '#F8FAFB';
  const text = '#0D1B2A';
  const muted = '#6B7A8F';
  const soft = '#E8F4F2';
  const brand = '#FF4500';
  const amount = props.amountLabel || '$0.00';
  const subtitle = props.subtitle || 'Total balance';

  return (
    <VStack
      modifiers={[
        background(bg),
        padding({ all: 14 }),
        widgetURL('worthy://'),
      ]}
    >
      <HStack modifiers={[padding({ bottom: 8 })]}>
        <VStack modifiers={[background(soft), cornerRadius(10), padding({ all: 6 })]}>
          <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle(brand)]}>W</Text>
        </VStack>
      </HStack>
      <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(muted)]}>
        {subtitle}
      </Text>
      <Text modifiers={[font({ size: 22, weight: 'semibold' }), foregroundStyle(text)]}>
        {amount}
      </Text>
    </VStack>
  );
};

const BalanceWidget = createWidget('BalanceWidget', BalanceWidgetLayout);
export default BalanceWidget;
