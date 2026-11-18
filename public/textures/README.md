# Earth globe textures

These are same-resolution WebP conversions of the existing Earth Live textures from the pinned upstream Three Globe release [v2.45.6](https://github.com/vasturiano/three-globe/tree/v2.45.6/example/img). The conversion preserves the original 4096×2048 color map and 2048×1024 relief map. The source JPEG and PNG were downloaded and converted with Pillow using qualities 82 and 88 respectively. See the QA workflow `prepare-earth-textures.yml` to reproduce them. No geographic data was changed.

| Asset | Original bytes | WebP bytes |
|---|---:|---:|
| Earth blue marble | 1461877 | 663160 |
| Earth topology | 378243 | 60032 |

Upstream license:

MIT License

Copyright (c) 2019 Vasco Asturiano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
