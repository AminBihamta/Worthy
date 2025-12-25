import React from 'react';
import { Dimensions } from 'react-native';
import { G, Path } from 'react-native-svg';
import {
  Background,
  Bar,
  Curve,
  Slice,
  VictoryAxis as BaseVictoryAxis,
  VictoryBar as BaseVictoryBar,
  VictoryChart as BaseVictoryChart,
  VictoryClipContainer,
  VictoryContainer,
  VictoryLabel,
  VictoryLine as BaseVictoryLine,
  VictoryPie as BaseVictoryPie,
  VictoryPolarAxis as BaseVictoryPolarAxis,
} from 'victory-native';

const getWidth = () => Dimensions.get('window').width;

function AxisLine(props: {
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string | number[];
    opacity?: number;
    strokeLinecap?: 'butt' | 'round' | 'square';
    strokeLinejoin?: 'miter' | 'round' | 'bevel';
  };
}) {
  const { x1, x2, y1, y2, style } = props;
  const stroke = style?.stroke ?? 'transparent';
  const strokeWidth = style?.strokeWidth ?? 1;
  if (stroke === 'transparent' || strokeWidth === 0 || x1 == null || x2 == null) {
    return null;
  }
  return (
    <Path
      d={`M ${x1} ${y1 ?? 0} L ${x2} ${y2 ?? 0}`}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={style?.strokeDasharray}
      opacity={style?.opacity}
      strokeLinecap={style?.strokeLinecap}
      strokeLinejoin={style?.strokeLinejoin}
      fill="none"
      vectorEffect="non-scaling-stroke"
    />
  );
}

export function VictoryAxis(props: React.ComponentProps<typeof BaseVictoryAxis>) {
  return (
    <BaseVictoryAxis
      width={props.width ?? getWidth()}
      axisComponent={props.axisComponent ?? <AxisLine />}
      axisLabelComponent={props.axisLabelComponent ?? <VictoryLabel />}
      tickLabelComponent={props.tickLabelComponent ?? <VictoryLabel />}
      tickComponent={props.tickComponent ?? <AxisLine />}
      gridComponent={props.gridComponent ?? <AxisLine />}
      groupComponent={props.groupComponent ?? <G />}
      containerComponent={props.containerComponent ?? <VictoryContainer />}
      {...props}
    />
  );
}

export function VictoryPolarAxis(props: React.ComponentProps<typeof BaseVictoryPolarAxis>) {
  return (
    <BaseVictoryPolarAxis
      width={props.width ?? getWidth()}
      axisComponent={props.axisComponent ?? <AxisLine />}
      axisLabelComponent={props.axisLabelComponent ?? <VictoryLabel />}
      tickLabelComponent={props.tickLabelComponent ?? <VictoryLabel />}
      tickComponent={props.tickComponent ?? <AxisLine />}
      gridComponent={props.gridComponent ?? <AxisLine />}
      groupComponent={props.groupComponent ?? <G />}
      containerComponent={props.containerComponent ?? <VictoryContainer />}
      {...props}
    />
  );
}

export function VictoryLine(props: React.ComponentProps<typeof BaseVictoryLine>) {
  return (
    <BaseVictoryLine
      width={props.width ?? getWidth()}
      dataComponent={props.dataComponent ?? <Curve />}
      labelComponent={props.labelComponent ?? <VictoryLabel />}
      containerComponent={props.containerComponent ?? <VictoryContainer />}
      groupComponent={props.groupComponent ?? <VictoryClipContainer />}
      {...props}
    />
  );
}

export function VictoryBar(props: React.ComponentProps<typeof BaseVictoryBar>) {
  return (
    <BaseVictoryBar
      width={props.width ?? getWidth()}
      dataComponent={props.dataComponent ?? <Bar />}
      labelComponent={props.labelComponent ?? <VictoryLabel />}
      containerComponent={props.containerComponent ?? <VictoryContainer />}
      groupComponent={props.groupComponent ?? <G />}
      {...props}
    />
  );
}

export function VictoryPie(props: React.ComponentProps<typeof BaseVictoryPie>) {
  const width = props.width ?? getWidth();
  return (
    <BaseVictoryPie
      width={width}
      height={props.height ?? width}
      dataComponent={props.dataComponent ?? <Slice />}
      labelComponent={props.labelComponent ?? <VictoryLabel />}
      containerComponent={props.containerComponent ?? <VictoryContainer />}
      groupComponent={props.groupComponent ?? <G />}
      {...props}
    />
  );
}

export function VictoryChart(props: React.ComponentProps<typeof BaseVictoryChart>) {
  return (
    <BaseVictoryChart
      width={props.width ?? getWidth()}
      backgroundComponent={props.backgroundComponent ?? <Background />}
      containerComponent={props.containerComponent ?? <VictoryContainer />}
      groupComponent={props.groupComponent ?? <G />}
      defaultAxes={
        props.defaultAxes ?? {
          independent: <VictoryAxis />,
          dependent: <VictoryAxis dependentAxis />,
        }
      }
      defaultPolarAxes={
        props.defaultPolarAxes ?? {
          independent: <VictoryPolarAxis />,
          dependent: <VictoryPolarAxis dependentAxis />,
        }
      }
      prependDefaultAxes={props.prependDefaultAxes ?? true}
      {...props}
    />
  );
}
