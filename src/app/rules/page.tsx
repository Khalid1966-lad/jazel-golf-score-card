'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  BookOpen,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  Info
} from 'lucide-react';
import golfRulesData from '@/data/golf-rules.json';

interface RuleSection {
  number: string;
  title: string;
  content: string;
  subsections?: RuleSection[];
}

interface Rule {
  id: string;
  number: number;
  title: string;
  purpose: string;
  sections: RuleSection[];
  keywords: string[];
}

interface Part {
  id: string;
  number: number;
  title: string;
  description: string;
  rules: number[];
}

interface SearchResult {
  rule: Rule;
  section?: RuleSection;
  matchType: 'title' | 'purpose' | 'content' | 'keyword';
  matchedText: string;
}

export default function RulesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPart, setSelectedPart] = useState<number | null>(null);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [highlightedText, setHighlightedText] = useState<string>('');

  // Get data from imported JSON
  const parts = golfRulesData.parts as Part[];
  const rules = golfRulesData.rules as Rule[];
  const definitions = golfRulesData.definitions;

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];
    const seen = new Set<string>();

    rules.forEach(rule => {
      // Search in title
      if (rule.title.toLowerCase().includes(query)) {
        const key = `${rule.id}-title`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            rule,
            matchType: 'title',
            matchedText: rule.title
          });
        }
      }

      // Search in purpose
      if (rule.purpose.toLowerCase().includes(query)) {
        const key = `${rule.id}-purpose`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            rule,
            matchType: 'purpose',
            matchedText: rule.purpose.substring(0, 150) + '...'
          });
        }
      }

      // Search in keywords
      rule.keywords?.forEach(keyword => {
        if (keyword.toLowerCase().includes(query)) {
          const key = `${rule.id}-keyword-${keyword}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              rule,
              matchType: 'keyword',
              matchedText: `Keyword: ${keyword}`
            });
          }
        }
      });

      // Search in sections
      const searchInSection = (section: RuleSection, parentNumber: string = '') => {
        const sectionKey = `${rule.id}-${section.number}`;
        
        if (section.title.toLowerCase().includes(query)) {
          if (!seen.has(sectionKey)) {
            seen.add(sectionKey);
            results.push({
              rule,
              section,
              matchType: 'content',
              matchedText: `${section.number} ${section.title}`
            });
          }
        }
        
        if (section.content.toLowerCase().includes(query)) {
          if (!seen.has(sectionKey)) {
            seen.add(sectionKey);
            const index = section.content.toLowerCase().indexOf(query);
            const start = Math.max(0, index - 50);
            const end = Math.min(section.content.length, index + query.length + 50);
            const context = (start > 0 ? '...' : '') + 
              section.content.substring(start, end) + 
              (end < section.content.length ? '...' : '');
            
            results.push({
              rule,
              section,
              matchType: 'content',
              matchedText: context
            });
          }
        }

        section.subsections?.forEach(sub => searchInSection(sub, section.number));
      };

      rule.sections.forEach(section => searchInSection(section));
    });

    setSearchResults(results.slice(0, 20));
    setShowSearchResults(true);
  }, [searchQuery, rules]);

  // Handle clicking on a search result
  const handleResultClick = (result: SearchResult) => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSelectedRule(result.rule.id);
    
    const part = parts.find(p => p.rules.includes(result.rule.number));
    if (part) {
      setSelectedPart(part.number);
    }
    
    if (result.section) {
      setExpandedSections(prev => new Set(prev).add(result.section!.number));
    }
    
    setHighlightedText(searchQuery);
    setTimeout(() => setHighlightedText(''), 3000);
  };

  // Toggle section expansion
  const toggleSection = (sectionNumber: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionNumber)) {
        newSet.delete(sectionNumber);
      } else {
        newSet.add(sectionNumber);
      }
      return newSet;
    });
  };

  // Get rule by ID
  const getRuleById = (id: string) => rules.find(r => r.id === id);

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>');
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to App</span>
            </button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: '#39638b' }} />
              Rules of Golf
            </h1>
          </div>
          <Badge variant="outline" className="text-xs">
            USGA / R&A 2023-2026
          </Badge>
        </div>
      </header>

      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              {/* Search */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search rules..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Search Results */}
              <AnimatePresence>
                {showSearchResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4"
                  >
                    <Card className="border-yellow-200 bg-yellow-50/50">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm font-medium">
                          Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 pb-2">
                        <ScrollArea className="max-h-64">
                          <div className="px-2">
                            {searchResults.map((result, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleResultClick(result)}
                                className="w-full text-left p-2 rounded-lg hover:bg-yellow-100 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    Rule {result.rule.number}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {result.matchType}
                                  </span>
                                </div>
                                <p 
                                  className="text-sm mt-1 line-clamp-2"
                                  dangerouslySetInnerHTML={{ 
                                    __html: highlightMatch(result.matchedText, searchQuery) 
                                  }}
                                />
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Parts Navigation */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Parts & Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-1 px-2 pb-2">
                    {parts.map((part) => (
                      <div key={part.id}>
                        <button
                          onClick={() => {
                            setSelectedPart(selectedPart === part.number ? null : part.number);
                            setSelectedRule(null);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedPart === part.number
                              ? 'bg-slate-100 text-slate-900 font-medium'
                              : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'
                          }`}
                        >
                          <span>Part {part.number}: {part.title}</span>
                          {selectedPart === part.number ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        
                        <AnimatePresence>
                          {selectedPart === part.number && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-4 border-l-2 border-slate-200 pl-3 py-1 space-y-1">
                                {part.rules.map(ruleNum => {
                                  const rule = rules.find(r => r.number === ruleNum);
                                  if (!rule) return null;
                                  return (
                                    <button
                                      key={rule.id}
                                      onClick={() => setSelectedRule(rule.id)}
                                      className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
                                        selectedRule === rule.id
                                          ? 'bg-blue-100 text-blue-800 font-medium'
                                          : 'text-muted-foreground hover:bg-slate-50'
                                      }`}
                                    >
                                      Rule {rule.number}: {rule.title}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Mobile Search */}
            <div className="lg:hidden mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Search Results */}
            <AnimatePresence>
              {showSearchResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="lg:hidden mb-4"
                >
                  <Card className="border-yellow-200 bg-yellow-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Found {searchResults.length} results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 pb-2">
                      <ScrollArea className="max-h-48">
                        <div className="px-2">
                          {searchResults.map((result, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleResultClick(result)}
                              className="w-full text-left p-2 rounded-lg hover:bg-yellow-100 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  Rule {result.rule.number}
                                </Badge>
                              </div>
                              <p className="text-sm mt-1 line-clamp-1">{result.matchedText}</p>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rule Content */}
            {selectedRule ? (
              <RuleDetail 
                rule={getRuleById(selectedRule)!} 
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                highlightedText={highlightedText}
                onBack={() => setSelectedRule(null)}
              />
            ) : (
              <RulesOverview 
                parts={parts} 
                rules={rules}
                definitions={definitions}
                onSelectRule={setSelectedRule}
                onSelectPart={setSelectedPart}
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 z-50">
        <div className="flex gap-1 overflow-x-auto">
          {parts.map((part) => (
            <button
              key={part.id}
              onClick={() => {
                setSelectedPart(part.number);
                setSelectedRule(null);
              }}
              className={`flex-shrink-0 px-3 py-2 text-xs rounded-lg transition-colors ${
                selectedPart === part.number
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Part {part.number}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Rule Detail Component
function RuleDetail({ 
  rule, 
  expandedSections, 
  toggleSection,
  highlightedText,
  onBack 
}: { 
  rule: Rule; 
  expandedSections: Set<string>;
  toggleSection: (num: string) => void;
  highlightedText: string;
  onBack: () => void;
}) {
  if (!rule) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Overview
      </Button>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, #39638b 0%, #4a7aa8 100%)' }}
            >
              {rule.number}
            </div>
            <div>
              <CardTitle>Rule {rule.number}: {rule.title}</CardTitle>
              <CardDescription className="mt-1">
                {rule.keywords?.slice(0, 4).map(kw => (
                  <Badge key={kw} variant="secondary" className="mr-1 text-xs">
                    {kw}
                  </Badge>
                ))}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm font-medium text-blue-800 mb-1">Purpose</p>
            <p className="text-sm text-blue-700">{rule.purpose}</p>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-2">
        {rule.sections.map((section) => (
          <SectionCard 
            key={section.number}
            section={section}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            highlightedText={highlightedText}
            depth={0}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Section Card Component
function SectionCard({ 
  section, 
  expandedSections, 
  toggleSection,
  highlightedText,
  depth
}: { 
  section: RuleSection;
  expandedSections: Set<string>;
  toggleSection: (num: string) => void;
  highlightedText: string;
  depth: number;
}) {
  const isExpanded = expandedSections.has(section.number);
  const hasSubsections = section.subsections && section.subsections.length > 0;
  const isLongContent = section.content.length > 150;

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>');
  };

  // All sections can be expanded to read full content
  const canExpand = isLongContent || hasSubsections;

  return (
    <Card className={depth === 0 ? '' : 'border-l-4 border-l-blue-200'}>
      <CardContent className="p-0">
        <button
          onClick={() => canExpand && toggleSection(section.number)}
          className={`w-full text-left p-4 transition-colors ${canExpand ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="text-xs font-mono"
                  style={{ backgroundColor: '#d6e4ef' }}
                >
                  {section.number}
                </Badge>
                <h4 className="font-medium text-sm" style={{ color: '#39638b' }}>
                  {section.title}
                </h4>
              </div>
              {/* Show truncated content when not expanded */}
              {!isExpanded && (
                <p 
                  className="text-sm text-muted-foreground mt-2 line-clamp-2"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightMatch(section.content, highlightedText) 
                  }}
                />
              )}
            </div>
            {/* Show chevron for expandable sections */}
            {canExpand && (
              <ChevronDown 
                className={`w-5 h-5 text-muted-foreground transition-transform shrink-0 ${
                  isExpanded ? 'rotate-180' : ''
                }`} 
              />
            )}
          </div>
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                {/* Always show full content when expanded */}
                <p 
                  className="text-sm text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightMatch(section.content, highlightedText) 
                  }}
                />
                
                {/* Show subsections if they exist */}
                {hasSubsections && (
                  <div className="mt-4 space-y-2">
                    {section.subsections.map((sub) => (
                      <SectionCard
                        key={sub.number}
                        section={sub}
                        expandedSections={expandedSections}
                        toggleSection={toggleSection}
                        highlightedText={highlightedText}
                        depth={depth + 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// Rules Overview Component
function RulesOverview({ 
  parts, 
  rules,
  definitions,
  onSelectRule,
  onSelectPart 
}: { 
  parts: Part[];
  rules: Rule[];
  definitions: typeof golfRulesData.definitions;
  onSelectRule: (id: string) => void;
  onSelectPart: (num: number) => void;
}) {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Official Rules of Golf</h2>
              <p className="text-slate-300 text-sm">
                The official Rules of Golf as published by the USGA and R&A, effective January 2023. 
                Search by keyword or browse by part to find the information you need.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {parts.map((part) => (
          <motion.div
            key={part.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: part.number * 0.1 }}
          >
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
              onSelectPart(part.number);
              const firstRule = rules.find(r => r.number === part.rules[0]);
              if (firstRule) onSelectRule(firstRule.id);
            }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ background: 'linear-gradient(135deg, #39638b 0%, #4a7aa8 100%)' }}
                  >
                    {part.number}
                  </div>
                  <div>
                    <CardTitle className="text-lg">Part {part.number}: {part.title}</CardTitle>
                    <CardDescription>{part.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {part.rules.map(ruleNum => {
                    const rule = rules.find(r => r.number === ruleNum);
                    return rule ? (
                      <Badge 
                        key={ruleNum} 
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-slate-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRule(rule.id);
                        }}
                      >
                        {ruleNum}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Definitions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="w-5 h-5" style={{ color: '#39638b' }} />
            Key Definitions
          </CardTitle>
          <CardDescription>
            Common terms used throughout the Rules of Golf
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {definitions.slice(0, 8).map((def, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50">
                <p className="font-medium text-sm" style={{ color: '#39638b' }}>{def.term}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{def.definition}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Rules List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Rules</CardTitle>
          <CardDescription>
            Quick access to all {rules.length} rules
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {rules.map((rule) => (
              <button
                key={rule.id}
                onClick={() => onSelectRule(rule.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg, #39638b 0%, #4a7aa8 100%)' }}
                  >
                    {rule.number}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{rule.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{rule.purpose}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
