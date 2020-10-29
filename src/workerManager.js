export class WorkerManager {
  constructor() {
    this.worker = null;
  }
  handleMessage(msg) {
    console.log(msg);
  }
  getClientproxy() {
    if (!this.workerClientProxy) {
      this.worker = monaco.editor.createWebWorker({
        moduleId: 'MotokoWorker',
        label: 'motoko',
        keepIdleModels: true,
      });
      this.workerClientProxy = this.worker.getProxy();
    }
    return this.workerClientProxy;
  }
  async getLanguageServiceWorker(...resources) {
    const _client = await this.getClientproxy();
    await this.worker.withSyncedResources(resources);
    return _client;
  }
}
