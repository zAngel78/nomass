const fs = require('fs').promises;
const path = require('path');

class FileStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.ensureDataDirectory();
  }

  async ensureDataDirectory() {
    try {
      await fs.access(this.dataDir);
    } catch (error) {
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log('📁 Directorio de datos creado:', this.dataDir);
    }
  }

  getFilePath(filename) {
    return path.join(this.dataDir, `${filename}.json`);
  }

  async readFile(filename) {
    try {
      const filePath = this.getFilePath(filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Archivo no existe, devolver array vacío o objeto vacío
        return filename.includes('config') ? {} : [];
      }
      throw error;
    }
  }

  async writeFile(filename, data) {
    try {
      const filePath = this.getFilePath(filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Error escribiendo archivo ${filename}:`, error);
      throw error;
    }
  }

  async appendToFile(filename, newData) {
    const existingData = await this.readFile(filename);
    if (Array.isArray(existingData)) {
      existingData.push(newData);
    } else {
      Object.assign(existingData, newData);
    }
    return await this.writeFile(filename, existingData);
  }

  async updateInFile(filename, id, updatedData) {
    const data = await this.readFile(filename);
    if (Array.isArray(data)) {
      const index = data.findIndex(item => item.id === id);
      if (index !== -1) {
        data[index] = { ...data[index], ...updatedData };
        return await this.writeFile(filename, data);
      }
      return false;
    } else {
      data[id] = updatedData;
      return await this.writeFile(filename, data);
    }
  }

  async deleteFromFile(filename, id) {
    const data = await this.readFile(filename);
    if (Array.isArray(data)) {
      const filteredData = data.filter(item => item.id !== id);
      if (filteredData.length !== data.length) {
        await this.writeFile(filename, filteredData);
        return true;
      }
      return false;
    } else {
      if (data[id]) {
        delete data[id];
        await this.writeFile(filename, data);
        return true;
      }
      return false;
    }
  }

  async findInFile(filename, predicate) {
    const data = await this.readFile(filename);
    if (Array.isArray(data)) {
      return data.find(predicate);
    }
    return null;
  }

  async filterFromFile(filename, predicate) {
    const data = await this.readFile(filename);
    if (Array.isArray(data)) {
      return data.filter(predicate);
    }
    return [];
  }

  async backupFile(filename) {
    try {
      const data = await this.readFile(filename);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `${filename}_backup_${timestamp}`;
      await this.writeFile(backupFilename, data);
      console.log(`✅ Backup creado: ${backupFilename}`);
      return true;
    } catch (error) {
      console.error(`Error creando backup para ${filename}:`, error);
      return false;
    }
  }
}

module.exports = new FileStorage();