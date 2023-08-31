quarto.log.output("=== Glossary Log ===")


--================--
-- Core Functions --
--================--

local options_contents = "glossary-default"
local options_class = "definition"
local options_contents = nil

-- Read in YAML options
local function read_meta(meta)
  -- permitted options include:
  -- glossary:
  --   id: string
  --   class: string
  --   contents:
  --     - "first-file.qmd"
  --     - "second-file.qmd"

  local options = meta["glossary"]
  
  -- read id
  if options.id ~= nil then
      options_id = options.id[1].text
  end
  
  -- read class
  if options.class ~= nil then
      options_class = options.class[1].text
  end
  
  -- read contents and return list of files to scan for blocks
  files_added = {}
  files_to_scan = {}
  if options.contents ~= nil then
    for g = 1,#options.contents do
      glob = options.contents[g][1].text
      if string.sub(glob, 1, 1) ~= "!" then -- add these files
        for f in io.popen("find . -type f \\( -name '*.qmd' -o -name '*.md' -o -name '*.ipynb' \\) -not \\( -path '*/.*' -o -path '*/_*' \\) -not \\( -name 'README.md' -o -name 'README.qmd' \\)"):lines() do
          glob_match = string.match(f, globtopattern("./" .. glob))
          if glob_match ~=nil and new_file(files_added, glob_match) then
            files_added[#files_added + 1] = glob_match
          end
        end
      else -- remove these files
        ignored_glob = string.sub(glob, 2)
        for i = 1,#files_added do
          if (string.match(files_added[i], globtopattern("./" .. ignored_glob)) == nil) then
            files_to_scan[#files_to_scan + 1] = files_added[i]
          end
        end
      end
    end
    
    if #files_to_scan == 0 then
      files_to_scan = files_added
    end
    
  else
    for f in io.popen("find . -type f \\( -name '*.qmd' -o -name '*.md' -o -name '*.ipynb' \\) -not \\( -path '*/.*' -o -path '*/_*' \\) -not \\( -name 'README.md' -o -name 'README.qmd' \\)"):lines() do
      files_to_scan[#files_to_scan + 1] = f
    end
  end
  
  quarto.log.output("Files to be scanned: ", files_to_scan)
end



-- Insert glossary contents into the appropriate Div block
function insert_glossary(div)
  
  local filtered_blocks = {}
  
  -- find divs that match id
  if (div.identifier == options_id) then
    for _,filename in ipairs(files_to_scan) do -- read contents of files in glossary: contents
      local file_contents = pandoc.read(io.open(filename):read "*a", "markdown", PANDOC_READER_OPTIONS).blocks
      for _, block in ipairs(file_contents) do 
        -- find blocks that meet conditions
        if (block.classes ~= nil and block.t == "Div" and block.classes:includes(options_class)) then
          table.insert(filtered_blocks, block)  -- Add the block to the filtered table
        end
      end
    end
    return filtered_blocks
  end
end


--===================--
-- Utility Functions --
--===================--

-- check if element is in list
function new_file(list, element)
  out = true
  for i = 1, #list do
    if list[i] == element then
      out = false
      break 
    end
  end
  return out
end

-- convert globs to Lua patterns
-- written by davidm: https://github.com/davidm/lua-glob-pattern
function globtopattern(g)
  -- Some useful references:
  -- - apr_fnmatch in Apache APR.  For example,
  --   http://apr.apache.org/docs/apr/1.3/group__apr__fnmatch.html
  --   which cites POSIX 1003.2-1992, section B.6.

  local p = "^"  -- pattern being built
  local i = 0    -- index in g
  local c        -- char at index i in g.

  -- unescape glob char
  local function unescape()
    if c == '\\' then
      i = i + 1; c = g:sub(i,i)
      if c == '' then
        p = '[^]'
        return false
      end
    end
    return true
  end

  -- escape pattern char
  local function escape(c)
    return c:match("^%w$") and c or '%' .. c
  end

  -- Convert tokens at end of charset.
  local function charset_end()
    while 1 do
      if c == '' then
        p = '[^]'
        return false
      elseif c == ']' then
        p = p .. ']'
        break
      else
        if not unescape() then break end
        local c1 = c
        i = i + 1; c = g:sub(i,i)
        if c == '' then
          p = '[^]'
          return false
        elseif c == '-' then
          i = i + 1; c = g:sub(i,i)
          if c == '' then
            p = '[^]'
            return false
          elseif c == ']' then
            p = p .. escape(c1) .. '%-]'
            break
          else
            if not unescape() then break end
            p = p .. escape(c1) .. '-' .. escape(c)
          end
        elseif c == ']' then
          p = p .. escape(c1) .. ']'
          break
        else
          p = p .. escape(c1)
          i = i - 1 -- put back
        end
      end
      i = i + 1; c = g:sub(i,i)
    end
    return true
  end

  -- Convert tokens in charset.
  local function charset()
    i = i + 1; c = g:sub(i,i)
    if c == '' or c == ']' then
      p = '[^]'
      return false
    elseif c == '^' or c == '!' then
      i = i + 1; c = g:sub(i,i)
      if c == ']' then
        -- ignored
      else
        p = p .. '[^'
        if not charset_end() then return false end
      end
    else
      p = p .. '['
      if not charset_end() then return false end
    end
    return true
  end

  -- Convert tokens.
  while 1 do
    i = i + 1; c = g:sub(i,i)
    if c == '' then
      p = p .. '$'
      break
    elseif c == '?' then
      p = p .. '.'
    elseif c == '*' then
      p = p .. '.*'
    elseif c == '[' then
      if not charset() then break end
    elseif c == '\\' then
      i = i + 1; c = g:sub(i,i)
      if c == '' then
        p = p .. '\\$'
        break
      end
      p = p .. escape(c)
    else
      p = p .. escape(c)
    end
  end
  return p
end


--====================--
-- Run Core Functions --
--====================--

return{
  {Meta = read_meta},
  {Div = insert_glossary}
}
