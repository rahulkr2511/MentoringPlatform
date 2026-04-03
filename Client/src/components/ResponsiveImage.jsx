import React from 'react';

const baseStyle = { maxWidth: '100%', height: 'auto' };

/**
 * Optimized responsive <img>: lazy loading by default, optional srcSet/sizes, stable dimensions.
 * Spread extra props for className overrides, fetchPriority, aria-*, etc.
 */
function ResponsiveImage({
  src,
  alt,
  width,
  height,
  srcSet,
  sizes,
  loading = 'lazy',
  style,
  ...rest
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      srcSet={srcSet}
      sizes={sizes}
      loading={loading}
      decoding="async"
      style={style ? { ...baseStyle, ...style } : baseStyle}
      {...rest}
    />
  );
}

export default ResponsiveImage;
