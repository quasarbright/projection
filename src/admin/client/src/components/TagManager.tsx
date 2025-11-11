import React, { useState, useRef, useEffect } from 'react';
import './TagManager.css';

interface TagManagerProps {
  selectedTags: string[];
  availableTags: string[];
  tagCounts?: Record<string, number>; // Tag usage counts for popularity sorting
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

interface TagSuggestion {
  name: string;
  count: number;
  similarity: number;
}

export function TagManager({
  selectedTags,
  availableTags,
  tagCounts = {},
  onChange,
  disabled = false,
}: TagManagerProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate similarity score (0-1, higher is better)
  const calculateSimilarity = (tag: string, query: string): number => {
    const tagLower = tag.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Exact match
    if (tagLower === queryLower) return 1.0;
    
    // Starts with query
    if (tagLower.startsWith(queryLower)) return 0.9;
    
    // Contains query at word boundary
    if (tagLower.includes(' ' + queryLower) || tagLower.includes('-' + queryLower)) {
      return 0.8;
    }
    
    // Contains query anywhere
    if (tagLower.includes(queryLower)) return 0.7;
    
    // Calculate Levenshtein-like similarity for fuzzy matching
    const maxLen = Math.max(tagLower.length, queryLower.length);
    let matches = 0;
    for (let i = 0; i < queryLower.length; i++) {
      if (tagLower.includes(queryLower[i])) matches++;
    }
    return (matches / maxLen) * 0.5;
  };

  // Compute filtered suggestions (memoized calculation, not in useEffect)
  const getFilteredSuggestions = (): TagSuggestion[] => {
    const input = inputValue.trim();
    
    // When input is empty, show all available tags sorted by popularity
    if (input === '') {
      return availableTags
        .filter((tag) => !selectedTags.includes(tag))
        .map((tag) => ({
          name: tag,
          count: tagCounts[tag] || 0,
          similarity: 1.0,
        }))
        .sort((a, b) => b.count - a.count); // Sort by popularity
    }

    // When typing, filter and sort by similarity + popularity
    return availableTags
      .filter((tag) => !selectedTags.includes(tag))
      .map((tag) => ({
        name: tag,
        count: tagCounts[tag] || 0,
        similarity: calculateSimilarity(tag, input),
      }))
      .filter((item) => item.similarity > 0.3) // Only show reasonably similar tags
      .sort((a, b) => {
        // Primary sort: similarity (higher first)
        const simDiff = b.similarity - a.similarity;
        if (Math.abs(simDiff) > 0.1) return simDiff;
        
        // Secondary sort: popularity (higher first)
        return b.count - a.count;
      });
  };

  const filteredSuggestions = getFilteredSuggestions();

  // Calculate dropdown position based on available space
  useEffect(() => {
    if (showSuggestions && containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 280; // max-height from CSS
      
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // If not enough space below but more space above, flip to above
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('above');
      } else {
        setDropdownPosition('below');
      }
    }
  }, [showSuggestions]);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag === '' || selectedTags.includes(trimmedTag)) {
      return;
    }

    onChange([...selectedTags, trimmedTag]);
    setInputValue('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Show suggestions when typing (will be computed on next render)
    if (newValue.trim() !== '') {
      setShowSuggestions(true);
    }
    
    setHighlightedIndex(-1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        // Select highlighted suggestion
        addTag(filteredSuggestions[highlightedIndex].name);
      } else if (inputValue.trim() !== '') {
        // Add new tag
        addTag(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Backspace' && inputValue === '' && selectedTags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  const handleSuggestionClick = (tagName: string) => {
    addTag(tagName);
  };

  const handleInputFocus = () => {
    // Show suggestions on focus (GitHub-style)
    // Only show if we have suggestions to display
    if (filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="tag-manager" ref={containerRef}>
      <div className={`tag-input-container ${disabled ? 'disabled' : ''}`}>
        {/* Selected tags as chips */}
        {selectedTags.map((tag) => (
          <div key={tag} className="tag-chip">
            <span className="tag-chip-text">{tag}</span>
            <button
              type="button"
              className="tag-chip-remove"
              onClick={() => removeTag(tag)}
              disabled={disabled}
              aria-label={`Remove ${tag} tag`}
            >
              ×
            </button>
          </div>
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          className="tag-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          disabled={disabled}
          placeholder={selectedTags.length === 0 ? 'Type to add tags...' : ''}
          aria-label="Add tags"
          aria-autocomplete="list"
          aria-controls="tag-suggestions"
          aria-expanded={showSuggestions}
        />
      </div>

      {/* Autocomplete suggestions - GitHub style */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          id="tag-suggestions"
          className={`tag-suggestions tag-suggestions-${dropdownPosition}`}
          role="listbox"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.name}
              className={`tag-suggestion ${index === highlightedIndex ? 'highlighted' : ''}`}
              onClick={() => handleSuggestionClick(suggestion.name)}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <span className="tag-suggestion-name">{suggestion.name}</span>
              {suggestion.count > 0 && (
                <span className="tag-suggestion-count">{suggestion.count}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Helper text */}
      {!showSuggestions && (
        <div className="tag-manager-hint">
          Click to see all tags, or type to filter
        </div>
      )}
      {showSuggestions && filteredSuggestions.length === 0 && inputValue.trim() !== '' && (
        <div className="tag-manager-hint">
          Press Enter to create "{inputValue}"
        </div>
      )}
    </div>
  );
}
