import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SparklinePositions } from "@/app/components/visualizations";

function getPolylinePoints(markup: string): Array<{ x: number; y: number }> {
  const pointsMatch = markup.match(/<polyline[^>]*points="([^"]+)"/);
  const points = pointsMatch?.[1];

  if (!points) {
    throw new Error("Expected sparkline polyline points.");
  }

  return points.split(" ").map((pair) => {
    const [x, y] = pair.split(",");

    return {
      x: Number.parseFloat(x),
      y: Number.parseFloat(y),
    };
  });
}

describe("SparklinePositions", () => {
  it("renders better finishes higher in the polyline", () => {
    const markup = renderToStaticMarkup(
      createElement(SparklinePositions, {
        positions: [1, 5, 3],
        label: "Recent position trend",
      }),
    );
    const points = getPolylinePoints(markup);

    expect(points[0]?.y).toBeLessThan(points[1]?.y);
  });

  it("renders the empty state when no positions are available", () => {
    const markup = renderToStaticMarkup(
      createElement(SparklinePositions, {
        positions: [],
        label: "Recent position trend",
      }),
    );

    expect(markup).toContain("No numeric positions available.");
  });
});
