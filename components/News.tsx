import React, { useState, useEffect } from 'react';
import { fetchMarketNews } from '../services/geminiService';
import type { NewsArticle } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';

const News: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchedTopic, setSearchedTopic] = useState('');

  const handleSearch = async (searchTopic: string) => {
    if (!searchTopic.trim()) return;

    setIsLoading(true);
    setArticles([]);
    setSearchedTopic(searchTopic);

    try {
      const result = await fetchMarketNews(searchTopic);
      setArticles(result.articles);
    } catch (error) {
       console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSearch(topic);
  }

  // Fetch initial news on component mount
  useEffect(() => {
      handleSearch('global market overview');
  }, []);
  
  const trendingTopics = ["AI Stocks", "Electric Vehicles", "Indian Stock Market", "Global Economy"];

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-base-content">Market News & Insights</h2>
        <p className="text-gray-500 mt-1">Get AI-powered summaries of the latest financial news.</p>
      </header>
      
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white text-base-content placeholder-gray-500"
          />
          <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Searching...' : 'Get News'}
          </Button>
        </form>
         <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Trending:</span>
            {trendingTopics.map(trending => (
                <button key={trending} onClick={() => { setTopic(trending); handleSearch(trending); }} className="px-3 py-1 bg-neutral text-sm rounded-full hover:bg-gray-200 transition-colors">
                    {trending}
                </button>
            ))}
        </div>
      </Card>
      
      {isLoading && <Spinner />}
      
      {!isLoading && articles.length > 0 && (
        <div>
            <h3 className="text-2xl font-bold mb-4 capitalize">AI News Summary for "{searchedTopic}"</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article, index) => (
                    <Card key={index} className="flex flex-col">
                       <div className="flex-1">
                         <h4 className="text-lg font-bold mb-2">{article.title}</h4>
                         <p className="text-gray-700 text-sm">{article.summary}</p>
                       </div>
                       <a href={article.source} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline mt-4 font-semibold self-start">
                          Read More &rarr;
                       </a>
                    </Card>
                ))}
            </div>
        </div>
      )}

      {!isLoading && articles.length === 0 && searchedTopic && (
          <Card>
            <p className="text-center text-gray-600">No news articles could be summarized for "{searchedTopic}". Please try another topic.</p>
          </Card>
      )}
    </div>
  );
};

export default News;