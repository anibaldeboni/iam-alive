import robot from 'robotjs';

enum ScreenQuadrants {
  BottomLeft = 1,
  BottomRight = 2,
  TopLeft = 3,
  TopRight = 4,
}

interface ScreenSize {
  width: number;
  height: number;
}

const rnorm = (mean = 0, std = 1) => {
  const _2PI = Math.PI * 2;

  const z0 = Math.sqrt(-2.0 * Math.log(Math.random())) * Math.cos(_2PI * Math.random());

  return z0 * std + mean;
};

const brownianIncrements = (n: number, base = 0) => {
  const steps: number[] = Array(n).fill(base);
  const nSquareRoot = Math.sqrt(n);

  return steps.reduce((acc: number[], curr: number, i: number) => {
    // Sampling from the Normal distribution
    const yi = rnorm(0, 200);
    // Weiner process
    const p0 = acc[i - 1] ?? curr; // previous calculated value or 0
    return [...acc, p0 + yi / nSquareRoot];
  }, []);
};

const defineCurrentQuadrant = (x: number, y: number, screenSize: ScreenSize) => {
  // +----------------+
  // |   3   |    4   |
  // |----------------|
  // |   1   |    2   |
  // +----------------+

  const { width, height } = screenSize;
  const halfHeight = height / 2;
  const halfWidth = width / 2;

  if (x < halfWidth && y < halfHeight) return ScreenQuadrants.BottomLeft;
  if (x >= halfWidth && y < halfHeight) return ScreenQuadrants.BottomRight;
  if (x < halfWidth && y >= halfHeight) return ScreenQuadrants.TopLeft;
  // if (x >= halfWidth && y >= halfHeight) return ScreenQuadrants.TopRight;
  return ScreenQuadrants.TopRight;
};

const definePathCalculationMethod = (currentQuadrant: ScreenQuadrants) => {
  const moveFromBottomToTop = (x: number, y: number) => (brownianIncrement: number, i: number) => ({
    x: Math.floor(x + brownianIncrement),
    y: y + i,
  });

  const moveFromTopToBottom = (x: number, y: number) => (brownianIncrement: number, i: number) => ({
    x: Math.floor(x + brownianIncrement),
    y: y - i,
  });

  const moveFromLeftToRight = (x: number, y: number) => (brownianIncrement: number, i: number) => ({
    x: x + i,
    y: Math.floor(y + brownianIncrement),
  });

  const moveFromRightToLeft = (x: number, y: number) => (brownianIncrement: number, i: number) => ({
    x: x - i,
    y: Math.floor(y + brownianIncrement),
  });

  if (currentQuadrant === ScreenQuadrants.BottomLeft) {
    return Math.random() > 0.5 ? moveFromBottomToTop : moveFromLeftToRight;
  }

  if (currentQuadrant === ScreenQuadrants.BottomRight) {
    return Math.random() > 0.5 ? moveFromBottomToTop : moveFromLeftToRight;
  }

  if (currentQuadrant === ScreenQuadrants.TopLeft) {
    return Math.random() > 0.5 ? moveFromLeftToRight : moveFromTopToBottom;
  }

  // if (currentQuadrant === ScreenQuadrants.TopRight) {
  //   return Math.random() > 0.5 ? moveFromRightToLeft : moveFromTopToBottom;
  // }

  return Math.random() > 0.5 ? moveFromRightToLeft : moveFromTopToBottom;
};

(async () => {
  const mousePosition = robot.getMousePos();
  const screenSize = robot.getScreenSize();
  const currentQuadrant = defineCurrentQuadrant(mousePosition.x, mousePosition.y, screenSize);
  const definePath = definePathCalculationMethod(currentQuadrant);
  const mousePathPlaybook = brownianIncrements(100).map(definePath(mousePosition.x, mousePosition.y));

  for (const pos of mousePathPlaybook) {
    console.log(pos);
    robot.moveMouse(pos.x, pos.y);
  }
})();
