// 在文件开头添加全局变量来跟踪压缩后的图片
let compressedImages = [];

// 将 formatFileSize 函数移到全局作用域
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewArea = document.getElementById('previewArea');

    // 处理拖拽事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // 添加拖拽效果
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        });
    });

    // 处理文件拖放
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFiles);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files: files } });
    }

    function handleFiles(e) {
        const files = [...e.target.files];
        files.forEach(processImage);
    }

    function processImage(file) {
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件！');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="预览图片">
                <div class="image-info">
                    <div class="image-details">
                        <p>原始大小：${formatFileSize(file.size)}</p>
                        <p>文件类型：${file.type}</p>
                        <p>文件名：${file.name}</p>
                    </div>
                    <div class="compression-controls">
                        <label>
                            压缩质量：<input type="range" min="0" max="100" value="80" class="quality-slider">
                            <span class="quality-value">80%</span>
                        </label>
                        <label>
                            最大宽度：<select class="max-width-select">
                                <option value="1920">1920px (Full HD)</option>
                                <option value="1280">1280px (HD)</option>
                                <option value="800">800px (移动设备)</option>
                                <option value="0">保持原始尺寸</option>
                            </select>
                        </label>
                        <label>
                            输出格式：<select class="format-select">
                                <option value="image/jpeg">JPEG (推荐照片)</option>
                                <option value="image/webp">WebP (最佳压缩)</option>
                                <option value="image/png">PNG (无损压缩)</option>
                            </select>
                        </label>
                        <div class="button-group">
                            <button onclick="compressImage(this)" class="compress-btn">压缩图片</button>
                            <button class="download-btn" style="display:none">下载压缩后的图片</button>
                            <button onclick="resetImage(this)" class="reset-btn" style="display:none">重置设置</button>
                            <button onclick="editImage(this)" class="edit-btn">编辑图片</button>
                        </div>
                    </div>
                    <div class="compression-results" style="display:none">
                        <p class="compressed-size"></p>
                        <p class="image-dimensions"></p>
                        <p class="compression-ratio"></p>
                        <p class="save-space"></p>
                    </div>
                </div>
            `;
            
            // 存储原始图片数据
            const img = preview.querySelector('img');
            img.dataset.original = e.target.result;
            
            // 添加质量滑块事件
            const qualitySlider = preview.querySelector('.quality-slider');
            const qualityValue = preview.querySelector('.quality-value');
            qualitySlider.addEventListener('input', function() {
                qualityValue.textContent = this.value + '%';
            });

            // 显示批量下载按钮
            const downloadAllBtn = document.getElementById('downloadAllBtn');
            downloadAllBtn.style.display = 'block';
            
            previewArea.appendChild(preview);
        }
        reader.readAsDataURL(file);
    }

    // 添加批量下载按钮的事件监听
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    downloadAllBtn.addEventListener('click', downloadAllImages);
});

// 压缩函数
function compressImage(button) {
    const previewCard = button.closest('.image-preview');
    const img = previewCard.querySelector('img');
    const quality = previewCard.querySelector('.quality-slider').value / 100;
    const maxWidth = parseInt(previewCard.querySelector('.max-width-select').value);
    const format = previewCard.querySelector('.format-select').value;
    const compressedSizeText = previewCard.querySelector('.compressed-size');
    const dimensionsText = previewCard.querySelector('.image-dimensions');
    const downloadBtn = previewCard.querySelector('.download-btn');
    const compressBtn = previewCard.querySelector('.compress-btn');

    // 禁用压缩按钮，显示加载状态
    compressBtn.disabled = true;
    compressBtn.textContent = '压缩中...';

    // 创建 Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 创建临时图片来获取原始尺寸
    const tempImg = new Image();
    tempImg.src = img.dataset.original;
    
    tempImg.onload = function() {
        // 计算新的尺寸
        let width = tempImg.width;
        let height = tempImg.height;
        
        if (maxWidth > 0 && width > maxWidth) {
            height = (maxWidth * height) / width;
            width = maxWidth;
        }

        // 设置 canvas 尺寸
        canvas.width = width;
        canvas.height = height;

        // 绘制图片
        ctx.drawImage(tempImg, 0, 0, width, height);

        // 转换为压缩后的图片
        const compressedDataUrl = canvas.toDataURL(format, quality);
        
        // 更新预览图片
        img.src = compressedDataUrl;

        // 计算压缩后的大小
        const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);
        const originalSize = Math.round((img.dataset.original.length * 3) / 4);
        const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        const savedSpace = formatFileSize(originalSize - compressedSize);
        
        compressedSizeText.textContent = `压缩后大小：${formatFileSize(compressedSize)}`;
        dimensionsText.textContent = `图片尺寸：${width}×${height}像素`;
        previewCard.querySelector('.compression-ratio').textContent = 
            `压缩比率：${compressionRatio}%`;
        previewCard.querySelector('.save-space').textContent = 
            `节省空间：${savedSpace}`;
            
        // 显示压缩结果区域
        previewCard.querySelector('.compression-results').style.display = 'block';
        // 显示重置按钮
        previewCard.querySelector('.reset-btn').style.display = 'block';

        // 显示下载按钮
        downloadBtn.style.display = 'block';
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            const extension = format.split('/')[1];
            link.download = `compressed-image.${extension}`;
            link.href = compressedDataUrl;
            link.click();
        };

        // 恢复压缩按钮状态
        compressBtn.disabled = false;
        compressBtn.textContent = '压缩图片';

        // 存储压缩后的图片信息
        const imageInfo = {
            dataUrl: compressedDataUrl,
            fileName: `compressed-image-${Date.now()}.${format.split('/')[1]}`,
            size: compressedSize
        };
        
        // 更新或添加到压缩图片数组
        const index = compressedImages.findIndex(img => 
            img.originalElement === previewCard);
        if (index !== -1) {
            compressedImages[index] = {...imageInfo, originalElement: previewCard};
        } else {
            compressedImages.push({...imageInfo, originalElement: previewCard});
        }
    };
} 

// 添加重置功能
function resetImage(button) {
    const previewCard = button.closest('.image-preview');
    const img = previewCard.querySelector('img');
    const qualitySlider = previewCard.querySelector('.quality-slider');
    const qualityValue = previewCard.querySelector('.quality-value');
    const maxWidthSelect = previewCard.querySelector('.max-width-select');
    const formatSelect = previewCard.querySelector('.format-select');
    const compressionResults = previewCard.querySelector('.compression-results');
    const downloadBtn = previewCard.querySelector('.download-btn');
    
    // 重置图片到原始状态
    img.src = img.dataset.original;
    
    // 重置控件
    qualitySlider.value = 80;
    qualityValue.textContent = '80%';
    maxWidthSelect.value = '1920';
    formatSelect.value = 'image/jpeg';
    
    // 隐藏结果和下载按钮
    compressionResults.style.display = 'none';
    downloadBtn.style.display = 'none';

    // 从压缩图片数组中移除
    const index = compressedImages.findIndex(img => 
        img.originalElement === previewCard);
    if (index !== -1) {
        compressedImages.splice(index, 1);
    }
    
    // 如果没有压缩图片了，隐藏批量下载按钮
    if (compressedImages.length === 0) {
        document.getElementById('downloadAllBtn').style.display = 'none';
    }
} 

// 添加批量下载功能
function downloadAllImages() {
    // 检查是否有压缩后的图片
    if (compressedImages.length === 0) {
        alert('没有可下载的压缩图片！');
        return;
    }

    // 显示进度条
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressContainer.style.display = 'block';

    // 创建 ZIP 文件
    const zip = new JSZip();
    let processedCount = 0;

    // 添加所有图片到 ZIP
    compressedImages.forEach((image, index) => {
        // 将 base64 转换为 blob
        const imageData = image.dataUrl.split(',')[1];
        zip.file(image.fileName, imageData, {base64: true});
        
        // 更新进度
        processedCount++;
        const progress = (processedCount / compressedImages.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `正在处理第 ${processedCount} 张，共 ${compressedImages.length} 张`;
    });

    // 生成并下载 ZIP 文件
    zip.generateAsync({type: 'blob'})
        .then(function(content) {
            // 创建下载链接
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `compressed-images-${Date.now()}.zip`;
            link.click();
            
            // 清理
            URL.revokeObjectURL(link.href);
            progressContainer.style.display = 'none';
        })
        .catch(function(error) {
            console.error('Error creating zip:', error);
            alert('创建压缩包时出错，请重试！');
            progressContainer.style.display = 'none';
        });
} 

// 添加图片编辑功能
function editImage(button) {
    const previewCard = button.closest('.image-preview');
    const img = previewCard.querySelector('img');
    const editToolbar = document.getElementById('editToolbar');
    
    // 显示编辑工具栏
    editToolbar.style.display = 'block';
    
    // 存储当前编辑的图片
    window.currentEditingImage = img;
    
    // 初始化编辑面板
    initEditPanels();
}

function initEditPanels() {
    const cropBtn = document.getElementById('cropBtn');
    const filterBtn = document.getElementById('filterBtn');
    const adjustBtn = document.getElementById('adjustBtn');
    
    // 清除所有面板的活动状态
    function clearActivePanels() {
        document.querySelectorAll('.edit-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }
    
    // 裁剪按钮点击事件
    cropBtn.onclick = function() {
        clearActivePanels();
        this.classList.add('active');
        document.getElementById('cropPanel').style.display = 'block';
        initCropTool();
    };
    
    // 滤镜按钮点击事件
    filterBtn.onclick = function() {
        clearActivePanels();
        this.classList.add('active');
        document.getElementById('filterPanel').style.display = 'block';
        initFilterTool();
    };
    
    // 调整按钮点击事件
    adjustBtn.onclick = function() {
        clearActivePanels();
        this.classList.add('active');
        document.getElementById('adjustPanel').style.display = 'block';
        initAdjustTool();
    };
} 

// 添加裁剪功能实现
function initCropTool() {
    const img = window.currentEditingImage;
    const cropPanel = document.getElementById('cropPanel');
    const cropRatio = document.getElementById('cropRatio');
    
    // 创建裁剪容器
    const cropContainer = document.createElement('div');
    cropContainer.className = 'crop-container';
    cropContainer.style.width = img.width + 'px';
    cropContainer.style.height = img.height + 'px';
    
    // 创建裁剪区域
    const cropArea = document.createElement('div');
    cropArea.className = 'crop-area';
    
    // 添加裁剪手柄
    ['nw', 'ne', 'sw', 'se'].forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `crop-handle ${pos}`;
        cropArea.appendChild(handle);
    });
    
    cropContainer.appendChild(cropArea);
    cropPanel.insertBefore(cropContainer, cropPanel.firstChild);
    
    // 初始化裁剪区域大小
    const initialSize = Math.min(img.width, img.height) * 0.8;
    cropArea.style.width = initialSize + 'px';
    cropArea.style.height = initialSize + 'px';
    cropArea.style.left = (img.width - initialSize) / 2 + 'px';
    cropArea.style.top = (img.height - initialSize) / 2 + 'px';
    
    // 添加裁剪比例变化监听
    cropRatio.addEventListener('change', function() {
        updateCropAreaRatio(cropArea, this.value);
    });
    
    // 添加裁剪区域拖动功能
    let isDragging = false;
    let startX, startY;
    
    cropArea.addEventListener('mousedown', function(e) {
        if (e.target === cropArea) {
            isDragging = true;
            startX = e.clientX - cropArea.offsetLeft;
            startY = e.clientY - cropArea.offsetTop;
        }
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const newLeft = e.clientX - startX;
            const newTop = e.clientY - startY;
            
            // 限制裁剪区域不超出图片边界
            cropArea.style.left = Math.max(0, Math.min(newLeft, 
                cropContainer.offsetWidth - cropArea.offsetWidth)) + 'px';
            cropArea.style.top = Math.max(0, Math.min(newTop, 
                cropContainer.offsetHeight - cropArea.offsetHeight)) + 'px';
        }
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
    
    // 添加应用裁剪按钮事件
    document.getElementById('applyCrop').onclick = function() {
        applyCrop(img, cropArea, cropContainer);
    };
    
    // 添加取消裁剪按钮事件
    document.getElementById('cancelCrop').onclick = function() {
        cropContainer.remove();
        document.getElementById('cropPanel').style.display = 'none';
        document.getElementById('cropBtn').classList.remove('active');
    };
}

// 添加滤镜功能实现
function initFilterTool() {
    const img = window.currentEditingImage;
    const filterPanel = document.getElementById('filterPanel');
    
    // 添加滤镜按钮点击事件
    filterPanel.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = function() {
            const filter = this.dataset.filter;
            applyFilter(img, filter);
            
            // 更新按钮状态
            filterPanel.querySelectorAll('.filter-btn').forEach(b => 
                b.classList.remove('active'));
            this.classList.add('active');
        };
    });
}

// 添加图片调整功能实现
function initAdjustTool() {
    const img = window.currentEditingImage;
    const brightness = document.getElementById('brightness');
    const contrast = document.getElementById('contrast');
    const saturation = document.getElementById('saturation');
    
    // 创建用于预览的 canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // 存储原始图片数据
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const originalData = new Uint8ClampedArray(imageData.data);
    
    // 添加调整变化监听
    [brightness, contrast, saturation].forEach(slider => {
        slider.addEventListener('input', function() {
            applyAdjustments(img, originalData, {
                brightness: brightness.value / 100,
                contrast: contrast.value / 100,
                saturation: saturation.value / 100
            });
        });
    });
    
    // 添加应用调整按钮事件
    document.getElementById('applyAdjust').onclick = function() {
        // 保存当前调整后的状态
        img.dataset.original = img.src;
        
        // 重置滑块
        brightness.value = 0;
        contrast.value = 0;
        saturation.value = 0;
    };
    
    // 添加重置按钮事件
    document.getElementById('resetAdjust').onclick = function() {
        brightness.value = 0;
        contrast.value = 0;
        saturation.value = 0;
        img.src = img.dataset.original;
    };
}

// 辅助函数：应用裁剪
function applyCrop(img, cropArea, cropContainer) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 获取裁剪区域的位置和大小
    const scale = img.naturalWidth / img.width;
    const cropX = parseInt(cropArea.style.left) * scale;
    const cropY = parseInt(cropArea.style.top) * scale;
    const cropWidth = cropArea.offsetWidth * scale;
    const cropHeight = cropArea.offsetHeight * scale;
    
    // 设置画布大小为裁剪区域大小
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    // 绘制裁剪后的图片
    ctx.drawImage(img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
    );
    
    // 更新图片
    img.src = canvas.toDataURL();
    img.dataset.original = img.src;
    
    // 清理裁剪界面
    cropContainer.remove();
    document.getElementById('cropPanel').style.display = 'none';
    document.getElementById('cropBtn').classList.remove('active');
}

// 辅助函数：应用滤镜
function applyFilter(img, filter) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    ctx.drawImage(img, 0, 0);
    
    switch(filter) {
        case 'grayscale':
            applyGrayscale(ctx, canvas.width, canvas.height);
            break;
        case 'sepia':
            applySepia(ctx, canvas.width, canvas.height);
            break;
        case 'warm':
            applyColorTone(ctx, canvas.width, canvas.height, [255, 220, 180]);
            break;
        case 'cool':
            applyColorTone(ctx, canvas.width, canvas.height, [180, 220, 255]);
            break;
        default:
            img.src = img.dataset.original;
            return;
    }
    
    img.src = canvas.toDataURL();
}

// 继续添加滤镜效果的具体实现...