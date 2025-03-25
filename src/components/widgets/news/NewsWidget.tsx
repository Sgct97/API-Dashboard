import { useState, useEffect } from 'react';
import axios from 'axios';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: {
    name: string;
  };
}

const NewsWidget = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [category, setCategory] = useState<string>('general');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(3600000); // 1 hour

  // Available categories for news
  const categories = [
    'general',
    'business',
    'technology',
    'science',
    'health',
    'sports',
    'entertainment'
  ];

  // Fetch news on initial load and when category changes
  useEffect(() => {
    fetchNews();
    
    // Set up refresh interval
    const intervalId = setInterval(() => {
      fetchNews();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [category, refreshInterval]);

  // Fetch news articles from NewsAPI
  const fetchNews = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use HackerNews API which doesn't require an API key
      const topStoriesResponse = await axios.get(
        'https://hacker-news.firebaseio.com/v0/topstories.json'
      );
      
      if (!topStoriesResponse.data || !Array.isArray(topStoriesResponse.data)) {
        throw new Error('Invalid data received from API');
      }
      
      // Get the first 10 stories
      const storyIds = topStoriesResponse.data.slice(0, 10);
      
      // Fetch each story details
      const storyPromises = storyIds.map(id => 
        axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
      );
      
      const storyResponses = await Promise.all(storyPromises);
      
      // Map to our article format
      const articles: NewsArticle[] = storyResponses.map(response => {
        const story = response.data;
        return {
          title: story.title,
          description: story.text || `Comments: ${story.descendants}`,
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          urlToImage: null,
          publishedAt: new Date(story.time * 1000).toISOString(),
          source: {
            name: 'Hacker News'
          }
        };
      });
      
      setArticles(articles);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(`API Error: ${err.response.status} - ${err.response.statusText}`);
        } else if (err.request) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(`Error: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching news');
      }
      
      console.error('News fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Search for news articles
  const searchNews = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      // If search is empty, revert to top headlines
      fetchNews();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // For searching, we'll use algolia search API for HackerNews
      const response = await axios.get(
        `https://hn.algolia.com/api/v1/search`, {
          params: {
            query: searchTerm,
            tags: 'story'
          }
        }
      );
      
      if (!response.data || !response.data.hits) {
        throw new Error('Invalid data received from API');
      }
      
      // Transform the data to match our interface
      const transformedArticles: NewsArticle[] = response.data.hits.map((item: any) => ({
        title: item.title || 'No Title',
        description: item.comment_text || `Points: ${item.points} | Comments: ${item.num_comments}`,
        url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
        urlToImage: null,
        publishedAt: new Date(item.created_at).toISOString(),
        source: {
          name: 'Hacker News'
        }
      }));
      
      setArticles(transformedArticles);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(`API Error: ${err.response.status} - ${err.response.statusText}`);
        } else if (err.request) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(`Error: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while searching news');
      }
      
      console.error('News search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setSearchTerm('');
  };

  // Handle refresh interval change
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRefreshInterval(parseInt(e.target.value));
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <form onSubmit={searchNews} className="flex mb-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search news..."
            className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-700"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Search'}
          </button>
        </form>
        
        <div className="flex justify-between items-center mb-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-2 py-1 text-xs rounded-full capitalize
                  ${category === cat
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="flex items-center ml-2">
            <select
              value={refreshInterval}
              onChange={handleIntervalChange}
              className="text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-1"
            >
              <option value="1800000">30min</option>
              <option value="3600000">1hr</option>
              <option value="7200000">2hr</option>
              <option value="14400000">4hr</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Error message display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Articles list */}
      {!isLoading && !error && articles.length > 0 && (
        <div className="overflow-y-auto">
          <div className="space-y-4">
            {articles.map((article, index) => (
              <article 
                key={index} 
                className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <h3 className="font-semibold mb-1">
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    {article.title}
                  </a>
                </h3>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {article.source.name} • {formatDate(article.publishedAt)}
                </div>
                {article.urlToImage && (
                  <div className="mb-2">
                    <img 
                      src={article.urlToImage} 
                      alt={article.title}
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {article.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && !error && articles.length === 0 && (
        <div className="flex justify-center items-center py-8 text-gray-500 dark:text-gray-400">
          <p>No news articles found. Try another search term or category.</p>
        </div>
      )}
    </div>
  );
};

export default NewsWidget; 