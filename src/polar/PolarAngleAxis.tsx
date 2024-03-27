import React, { PureComponent, ReactElement } from 'react';
import isFunction from 'lodash/isFunction';
import clsx from 'clsx';
import { Layer } from '../container/Layer';
import { Dot } from '../shape/Dot';
import { Polygon } from '../shape/Polygon';
import { Text } from '../component/Text';
import { BaseAxisProps, TickItem, adaptEventsOfChild, PresentationAttributesAdaptChildEvent } from '../util/types';
import { filterProps } from '../util/ReactUtils';
import { getTickClassName, polarToCartesian } from '../util/PolarUtils';

const RADIAN = Math.PI / 180;
const eps = 1e-5;

export interface PolarAngleAxisProps extends BaseAxisProps {
  angleAxisId?: string | number;
  cx?: number;
  cy?: number;
  radius?: number;
  axisLineType?: 'polygon' | 'circle';
  ticks?: TickItem[];
  orientation?: 'inner' | 'outer';
}

export type Props = PresentationAttributesAdaptChildEvent<any, SVGTextElement> & PolarAngleAxisProps;

export class PolarAngleAxis extends PureComponent<Props> {
  static displayName = 'PolarAngleAxis';

  static axisType = 'angleAxis';

  static defaultProps = {
    type: 'category',
    angleAxisId: 0,
    scale: 'auto',
    cx: 0,
    cy: 0,
    orientation: 'outer',
    axisLine: true,
    tickLine: true,
    tickSize: 8,
    tick: true,
    hide: false,
    allowDuplicatedCategory: true,
  };

  /**
   * Calculate the coordinate of line endpoint
   * @param data The data if there are ticks
   * @return (x1, y1): The point close to text,
   *         (x2, y2): The point close to axis
   */
  getTickLineCoord(data: TickItem): {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } {
    const { cx, cy, radius, orientation, tickSize } = this.props;
    const tickLineSize = tickSize || 8;
    const p1 = polarToCartesian(cx, cy, radius, data.coordinate);
    const p2 = polarToCartesian(cx, cy, radius + (orientation === 'inner' ? -1 : 1) * tickLineSize, data.coordinate);

    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  }

  /**
   * Get the text-anchor of each tick
   * @param data Data of ticks
   * @return text-anchor
   */
  getTickTextAnchor(data: TickItem): string {
    const { orientation } = this.props;
    const cos = Math.cos(-data.coordinate * RADIAN);
    let textAnchor;

    if (cos > eps) {
      textAnchor = orientation === 'outer' ? 'start' : 'end';
    } else if (cos < -eps) {
      textAnchor = orientation === 'outer' ? 'end' : 'start';
    } else {
      textAnchor = 'middle';
    }

    return textAnchor;
  }

  renderAxisLine(): ReactElement {
    const { cx, cy, radius, axisLine, axisLineType } = this.props;
    const props = {
      ...filterProps(this.props, false),
      fill: 'none',
      ...filterProps(axisLine, false),
    };

    if (axisLineType === 'circle') {
      return <Dot className="recharts-polar-angle-axis-line" {...props} cx={cx} cy={cy} r={radius} />;
    }
    const { ticks } = this.props;
    const points = ticks.map(entry => polarToCartesian(cx, cy, radius, entry.coordinate));

    return <Polygon className="recharts-polar-angle-axis-line" {...props} points={points} />;
  }

  static renderTickItem(option: PolarAngleAxisProps['tick'], props: any, value: string | number): ReactElement {
    let tickItem;

    if (React.isValidElement(option)) {
      tickItem = React.cloneElement(option, props);
    } else if (isFunction(option)) {
      tickItem = option(props);
    } else {
      tickItem = (
        <Text {...props} className="recharts-polar-angle-axis-tick-value">
          {value}
        </Text>
      );
    }

    return tickItem;
  }

  renderTicks() {
    const { ticks, tick, tickLine, tickFormatter, stroke } = this.props;
    const axisProps = filterProps(this.props, false);
    const customTickProps = filterProps(tick, false);
    const tickLineProps = {
      ...axisProps,
      fill: 'none',
      ...filterProps(tickLine, false),
    };

    const items = ticks.map((entry, i) => {
      const lineCoord = this.getTickLineCoord(entry);
      const textAnchor = this.getTickTextAnchor(entry);
      const tickProps = {
        textAnchor,
        ...axisProps,
        stroke: 'none',
        fill: stroke,
        ...customTickProps,
        index: i,
        payload: entry,
        x: lineCoord.x2,
        y: lineCoord.y2,
      };

      return (
        <Layer
          className={clsx('recharts-polar-angle-axis-tick', getTickClassName(tick))}
          key={`tick-${entry.coordinate}`}
          {...adaptEventsOfChild(this.props, entry, i)}
        >
          {tickLine && <line className="recharts-polar-angle-axis-tick-line" {...tickLineProps} {...lineCoord} />}
          {tick &&
            PolarAngleAxis.renderTickItem(tick, tickProps, tickFormatter ? tickFormatter(entry.value, i) : entry.value)}
        </Layer>
      );
    });

    return <Layer className="recharts-polar-angle-axis-ticks">{items}</Layer>;
  }

  render() {
    const { ticks, radius, axisLine } = this.props;

    if (radius <= 0 || !ticks || !ticks.length) {
      return null;
    }

    return (
      <Layer className={clsx('recharts-polar-angle-axis', this.props.className)}>
        {axisLine && this.renderAxisLine()}
        {this.renderTicks()}
      </Layer>
    );
  }
}
