import React from 'react';

declare global {
  namespace JSX {
    // map JSX.Element to React's element type
    type Element = React.ReactElement<any, any>;
    // allow any intrinsic elements (simple fallback)
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};
