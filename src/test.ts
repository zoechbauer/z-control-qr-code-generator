// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Fix for Karma test site scroll issue
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    body {
      overflow-y: auto !important;
      height: auto !important;
    }
    
    #karma {
      max-height: 100vh;
      overflow-y: auto;
    }
    
    .jasmine_html-reporter {
      max-height: 90vh;
      overflow-y: auto;
    }
    
    .summary {
      position: sticky;
      top: 0;
      background: white;
      z-index: 1000;
    }
  `;
  document.head.appendChild(style);
}

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
