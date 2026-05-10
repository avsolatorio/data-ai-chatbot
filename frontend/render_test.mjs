import React from 'react';
import { renderToString } from 'react-dom/server';
import { SearchResultCard } from '@data360/mcp-ui/search-card';

const mockData = {
  indicators: [
    {
      idno: "123",
      name: "Test Indicator",
      covers_country: { "JPN": true },
      periodicity: "Annual",
      database_name: "WDI"
    }
  ]
};

const html = renderToString(React.createElement(SearchResultCard, {
  indicators: mockData.indicators,
  title: "Test",
  subtitle: "Subtitle"
}));

console.log(html);
