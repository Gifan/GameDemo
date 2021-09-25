const fetch = require('../lib/node-fetch');
const Fs = require('fs');
const Path = require('path');

/**
 * 下载器
 */
const Downloader = {

    /**
     * Gitee 用户名
     */
    username: 'ifaswind',

    /**
     * Gitee 仓库
     */
    repository: 'ccc-quick-finder',

    /**
     * 获取所有发行版信息
     * @returns {Promise<object[]>}
     */
    async getReleases() {
        const releasesUrl = 'https://gitee.com/api/v5/repos/ifaswind/ccc-quick-finder/releases';
        // 发起网络请求
        const response = await fetch(releasesUrl, {
            method: 'GET',
            cache: 'no-cache',
            mode: 'no-cors',
        });
        // 请求结果
        if (response.status !== 200) {
            return null;
        }
        // 读取 json
        const json = response.json();
        return json;
    },

    async getLatestReleaseUrl() {
        const releases = await this.getReleases();
        if (!releases || releases.length === 0) {
            return null;
        }
        const latest = releases[releases.length - 1],
            fileUrl = latest.assets[0].browser_download_url;
        return fileUrl;
    },

    async downloadZip(url) {
        // request('https://gitee.com/ifaswind/ccc-quick-finder/attach_files/709593/download')
        //     .pipe(fs.createWriteStream('C:\\Users\\Shaun\\.CocosCreator\\packages\\ccc-quick-finder\\ccc-quick-finder.zip'))
        //     .on('close', () => {
        //     });
        console.log('downloadZip', 'start')
        // 发起网络请求
        let response = await fetch('https://gitee.com/ifaswind/ccc-quick-finder/attach_files/709593/download', {
            method: 'GET',
            cache: 'no-cache',
            mode: 'no-cors',
        });
        // 请求结果
        if (response.status !== 200) {
            return null;
        }
        const blob = await response.blob();
        const dstPath = Path.join(__dirname, 'ccc-quick-finder.zip')
        console.log('downloadZip', 'dstPath', dstPath)
        Fs.writeFile(dstPath, blob, (err, res) => {
            console.log(err, res)
        });
        console.log('downloadZip', 'done')
    },

};

module.exports = Downloader;