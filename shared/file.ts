interface IFileManager {
    select(): Promise<FileList>;
}

export class FileManager implements IFileManager {
    
    async selectAsText(): Promise<string> {
        const files = await this.select();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                resolve(e.target.result);
            }
            reader.readAsBinaryString(files[0]);
        })
    }

    select(): Promise<FileList> {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.click();
            input.addEventListener('change', (_event) => {
                if (!input.files) {
                    return;
                }
                resolve(input.files);
            });
        });
    }

    dowloadByURL(url: string, fileName: string): void {
        const htmlA = document.createElement('a');
        htmlA.href = url;
        htmlA.download = fileName;
        document.body.appendChild(htmlA);
        htmlA.click();
        setTimeout(() => {
            document.body.removeChild(htmlA);
        }, 0);
    }
}
