import fs from 'fs'
import * as path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'
import NodeGlobalsPolyfillPlugin from '@esbuild-plugins/node-globals-polyfill'

export default () => {
  return defineConfig({
    plugins: [react()],
    define: {
      global: 'globalThis'
    },
    server: {
      port: 3000,
      proxy: 'https://pixinvent.com/',
      cors: {
        origin: ['https://pixinvent.com/', 'http://localhost:3000'],
        methods: ['GET', 'PATCH', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          includePaths: ['node_modules', './src/assets']
        }
      },
      postcss: {
        plugins: [require('postcss-rtl')()]
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@src': path.resolve(__dirname, 'src'),
        '@store': path.resolve(__dirname, 'src/redux'),
        '@configs': path.resolve(__dirname, 'src/configs'),
        '@styles': path.resolve(__dirname, 'src/@core/scss'),
        '@utils': path.resolve(__dirname, 'src/utility/Utils'),
        '@hooks': path.resolve(__dirname, 'src/utility/hooks'),
        '@assets': path.resolve(__dirname, 'src/@core/assets'),
        '@layouts': path.resolve(__dirname, 'src/@core/layouts'),
        '@core': path.resolve(__dirname, 'src/@core'),
        '@components': path.resolve(__dirname, 'src/@core/components'),
        'stream': 'stream-browserify',
        'crypto': 'crypto-browserify',
        'url': 'rollup-plugin-node-polyfills/polyfills/url',
        'util': 'rollup-plugin-node-polyfills/polyfills/util',
        'zlib': 'rollup-plugin-node-polyfills/polyfills/zlib',
        'assert': 'rollup-plugin-node-polyfills/polyfills/assert',
        'buffer': 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
        'process': 'rollup-plugin-node-polyfills/polyfills/process-es6'
      }
    },
    esbuild: {
      loader: 'jsx',
      include: /.\/src\/.*\.js?$/,
      exclude: [],
      jsx: 'automatic'
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        },
        plugins: [
          NodeGlobalsPolyfillPlugin({
            buffer: true,
            process: true
          }),
          {
            name: 'load-js-files-as-jsx',
            setup(build) {
              build.onLoad({ filter: /src\\.*\.js$/ }, async args => ({
                loader: 'jsx',
                contents: await fs.readFileSync(args.path, 'utf8')
              }))
            }
          }
        ]
      }
    },
    build: {
      rollupOptions: {
        plugins: [rollupNodePolyFill()],
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['reactstrap', 'react-feather']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  })
}
