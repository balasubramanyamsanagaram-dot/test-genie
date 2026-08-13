import { ProjectModule, TestCase } from '../types';

export interface DiscoveredProject {
  name: string;
  rootPath: string;
  modules: ProjectModule[];
}

// Clean Slate: 0 default modules pre-loaded. Users create their own modules from scratch!
export const DEFAULT_HRMS_PROJECT: DiscoveredProject = {
  name: 'Clean Slate Repository',
  rootPath: '/Users/bits-blr-bala/Documents/Testing_New_HRM/New_HRMS',
  modules: []
};

export function generateTestCasesForDynamicModule(moduleName: string, frontendPath: string, backendPath: string): TestCase[] {
  return [];
}
