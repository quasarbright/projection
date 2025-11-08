import React, { useState, useRef, useEffect } from 'react';
import './TagManager.css';

interface TagManagerProps {
  selectedTags: string[];
  availableTags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function TagManager({
  selectedTags,
  availableTags,
  onChange,
  disabled = false,
}: TagManagerProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const input = inputValue.toLowerCase().trim();
    const suggestions = availableTags
      .filter((tag) => {
        // Don't suggest already selected tags
        if (selectedTags.includes(tag)) {
          return false;
        }
        // Match tags that start with or contain the input
        return tag.toLowerCase().includes(input);
      })
      .sort((a, b) => {
        // Prioritize tags that start with the input
        const aStarts = a.toLowerCase().startsWith(input);
        const bStarts = b.toLowerCase().startsWith(input);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      });

    setFilteredSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
    setHighlightedIndex(-1);
  }, [inputValue, availableTags, selectedTags]);

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
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        // Select highlighted suggestion
        addTag(filteredSuggestions[highlightedIndex]);
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

  const handleSuggestionClick = (tag: string) => {
    addTag(tag);
  };

  const handleInputFocus = () => {
    if (inputValue.trim() !== '' && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="tag-manager">
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

      {/* Autocomplete suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          id="tag-suggestions"
          className="tag-suggestions"
          role="listbox"
        >
          {filteredSuggestions.map((tag, index) => (
            <div
              key={tag}
              className={`tag-suggestion ${index === highlightedIndex ? 'highlighted' : ''}`}
              onClick={() => handleSuggestionClick(tag)}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              {tag}
            </div>
          ))}
        </div>
      )}

      {/* Helper text */}
      <div className="tag-manager-hint">
        Press Enter to add a tag, or select from suggestions
      </div>
    </div>
  );
}
