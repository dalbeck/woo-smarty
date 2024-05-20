import { promises as fs } from 'fs';
import path from 'path';
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminOptipng from 'imagemin-optipng';
import imageminSvgo from 'imagemin-svgo';

class ImageminCustomPlugin {
    apply(compiler) {
        compiler.hooks.afterEmit.tapPromise('ImageminCustomPlugin', async (compilation) => {
            const assets = Object.keys(compilation.assets).filter((asset) => /\.(jpe?g|png|svg)$/i.test(asset));

            const optimizeImage = async (assetName) => {
                const assetPath = path.resolve(compiler.outputPath, assetName);
                try {
                    const input = await fs.readFile(assetPath);
                    const result = await imagemin.buffer(input, {
                        plugins: [
                            imageminMozjpeg({ quality: 75, progressive: true }),
                            imageminOptipng({ optimizationLevel: 5 }),
                            imageminSvgo({
                                plugins: [
                                    { removeViewBox: false },
                                    { cleanupIDs: false },
                                ],
                            }),
                        ],
                    });
                    await fs.writeFile(assetPath, result);
                } catch (err) {
                    console.error(`Error optimizing image ${assetName}:`, err);
                }
            };

            await Promise.all(assets.map(optimizeImage));
        });
    }
}

export default ImageminCustomPlugin;
