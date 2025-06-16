// import { CONFIG } from '../config/config.js';
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = window.supabase;

// Global state
let isInitialized = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// DOM Elements
let partInput, searchBtn, resultBody, resultSection, generateBtn;

// Initialize DOM elements
function initializeElements() {
  partInput = document.getElementById('partSearchInput');
  searchBtn = document.getElementById('searchBtn');
  resultBody = document.getElementById('resultBody');
  resultSection = document.getElementById('searchResultSection');
  generateBtn = document.getElementById('generateBtn');

  console.log('Elements initialized:', {
    partInput: !!partInput,
    searchBtn: !!searchBtn,
    resultBody: !!resultBody,
    resultSection: !!resultSection,
    generateBtn: !!generateBtn
  });
}

// Remove all event listeners
function cleanupEventListeners() {
  if (searchBtn) searchBtn.replaceWith(searchBtn.cloneNode(true));
  if (generateBtn) generateBtn.replaceWith(generateBtn.cloneNode(true));
}

// Initialize event listeners
function initializeEventListeners() {
  if (searchBtn) {
    searchBtn.addEventListener('click', async () => {
      const partNo = partInput.value.trim();
      if (!partNo) {
        alert('Please enter a Part No.');
        return;
      }

      try {
        const { data: items, error } = await supabase
          .from('receiving_items')
          .select(`
            label_id,
            quantity,
            location_code,
            part_no,
            receiving_log (
              received_at
            )
          `)
          .ilike('part_no', `%${partNo}%`)
          .order('receiving_log.received_at', { ascending: true });

        if (error) throw error;

        if (!Array.isArray(items) || items.length === 0) {
          alert('No matching inventory found.');
          return;
        }

        resultSection.classList.remove('hidden');
        resultBody.innerHTML = '';

        for (const item of items) {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td class="p-2 text-center"><input type="checkbox" data-label-id="${item.label_id}" data-qty="${item.quantity}" data-location="${item.location_code}" data-part="${item.part_no}" /></td>
            <td class="p-2">${item.part_no}</td>
            <td class="p-2">${item.quantity}</td>
            <td class="p-2">${item.receiving_log?.received_at?.substring(0, 10) || ''}</td>
            <td class="p-2">${item.location_code}</td>
          `;
          resultBody.appendChild(row);
        }
      } catch (err) {
        console.error(err);
        alert('Error loading inventory.');
      }
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      const selectedItems = Array.from(resultBody.querySelectorAll('input[type="checkbox"]:checked'))
        .map(input => ({
          label_id: input.dataset.labelId,
          quantity: parseInt(input.dataset.qty),
          location: input.dataset.location,
          part_no: input.dataset.part
        }));

      if (selectedItems.length === 0) {
        alert('Please select items to ship.');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('shipping_instruction')
          .insert({
            items: selectedItems,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;

        alert('Shipping instruction created successfully!');
        // Reset form
        partInput.value = '';
        resultSection.classList.add('hidden');
        resultBody.innerHTML = '';
      } catch (err) {
        console.error(err);
        alert('Error creating shipping instruction.');
      }
    });
  }
}

// Main initialization function
export async function initSection() {
  if (isInitialized) {
    console.log('Section already initialized, cleaning up...');
    cleanupEventListeners();
  }

  console.log('Initializing shipping section...');
  initializeElements();
  initializeEventListeners();
  
  isInitialized = true;
  retryCount = 0;
}
