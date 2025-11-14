"""
Main entry point for the price comparison scraper with Selenium support.
Handles Cloudflare-protected websites automatically.
"""
import os
from tqdm import tqdm
from datetime import datetime

from utils.excel_handler import read_oem_codes, save_results_with_summary
from scrapers import scrape_inkdepot
from scrapers.hottoner_scraper import scrape_hottoner
from scrapers.selenium_scraper import SeleniumScraper


def run_scraper(input_file, output_file, scrapers_to_use=None, batch_size=None, use_selenium=True):
    """
    Main scraper function that coordinates all scraping operations.
    
    Args:
        input_file (str): Path to input Excel file with OEM codes
        output_file (str): Path to output Excel file for results
        scrapers_to_use (list): List of scraper functions to use (default: all)
        batch_size (int): Number of codes to process (None = all)
        use_selenium (bool): Use Selenium for InkStation (bypasses Cloudflare)
    """
    print("\n" + "="*60)
    print("🚀 PRICE COMPARISON SCRAPER (WITH CLOUDFLARE BYPASS)")
    print("="*60 + "\n")
    
    # Read OEM codes
    try:
        oem_codes = read_oem_codes(input_file)
    except Exception as e:
        print(f"❌ Failed to read input file: {e}")
        return
    
    if not oem_codes:
        print("❌ No OEM codes found in input file!")
        return
    
    # Apply batch size if specified
    if batch_size and batch_size < len(oem_codes):
        print(f"📦 Processing first {batch_size} codes (batch mode)")
        oem_codes = oem_codes[:batch_size]
    
    # Setup Selenium scraper for InkStation (Cloudflare protected)
    selenium_scraper = None
    if use_selenium:
        print("🌐 Initializing Selenium for Cloudflare bypass...")
        print("   💡 Browser will open - this is normal!")
        print("   💡 Cloudflare challenges will be solved automatically\n")
        selenium_scraper = SeleniumScraper(headless=False)  # Set to True to hide browser
    
    # Define scrapers to use
    if scrapers_to_use is None:
        scrapers_to_use = []
        
        # InkStation with Selenium (Cloudflare protected)
        if use_selenium and selenium_scraper:
            scrapers_to_use.append(("Ink Station", lambda code: selenium_scraper.scrape_inkstation(code)))
        
        # HotToner (regular requests)
        scrapers_to_use.append(("Hot Tonner", scrape_hottoner))
        
        # Other sites (may work with regular requests)
        # scrapers_to_use.append(("InkDepot", scrape_inkdepot))
    
    print(f"🌐 Active scrapers: {', '.join([name for name, _ in scrapers_to_use])}")
    print(f"📊 Total OEM codes to process: {len(oem_codes)}\n")
    
    # Scrape data - collect all results per OEM code first
    consolidated_results = []
    total_operations = len(oem_codes) * len(scrapers_to_use)
    
    try:
        with tqdm(total=total_operations, desc="Overall Progress", unit="request") as pbar:
            for code in oem_codes:
                pbar.set_description(f"Processing {code}")
                
                # Create a single row for this OEM code
                row_data = {"OEM_CODE": code}
                
                for site_name, scraper_func in scrapers_to_use:
                    try:
                        result = scraper_func(code)
                        if result:
                            # Add price to the row with website name as column
                            price = result.get("Price", "N/A")
                            row_data[site_name] = price
                    except Exception as e:
                        print(f"\n❌ Error with {site_name} for {code}: {e}")
                        row_data[site_name] = "Error"
                    
                    pbar.update(1)
                
                consolidated_results.append(row_data)
    
    finally:
        # Always close Selenium browser
        if selenium_scraper:
            print("\n🔒 Closing browser...")
            selenium_scraper.close()
    
    # Save results
    print("\n" + "-"*60)
    if consolidated_results:
        # Save consolidated results (one row per OEM code)
        import pandas as pd
        df = pd.DataFrame(consolidated_results)
        
        # Ensure output directory exists
        output_dir = os.path.dirname(output_file)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        df.to_excel(output_file, index=False, engine='openpyxl')
        print(f"✅ Results saved to {output_file}")
        
        # Print summary statistics
        print("\n📈 SCRAPING SUMMARY:")
        print("-"*60)
        print(f"✅ Total OEM codes processed: {len(consolidated_results)}")
        
        # Count successful scrapes per website
        for site_name, _ in scrapers_to_use:
            if site_name in df.columns:
                found = df[site_name].apply(lambda x: x not in ['N/A', 'Error', None]).sum()
                print(f"   {site_name}: {found}/{len(df)} found")
        
        print(f"⏱️  Scraping completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    else:
        print("❌ No results were collected!")
    
    print("\n" + "="*60)
    print("✨ SCRAPING COMPLETE!")
    print("="*60 + "\n")


def main():
    """
    Main function - configure your scraping parameters here.
    """
    # Configuration
    INPUT_FILE = os.path.join("data", "oem_codes.xlsx")
    OUTPUT_FILE = os.path.join("data", "price_comparison.xlsx")
    
    # IMPORTANT: Batch size for testing
    # Start with small number to test Cloudflare bypass
    BATCH_SIZE = None  # Test with 10 codes first
    # BATCH_SIZE = None  # Uncomment to process all codes
    
    # Use Selenium for Cloudflare bypass (RECOMMENDED)
    USE_SELENIUM = True  # Set to False to use regular requests (will get 403 errors)
    
    # Optional: Select specific scrapers (None = use all)
    SCRAPERS = None  # Use all available scrapers
    
    print("⚙️  CONFIGURATION:")
    print(f"   📂 Input: {INPUT_FILE}")
    print(f"   📂 Output: {OUTPUT_FILE}")
    print(f"   📦 Batch Size: {BATCH_SIZE if BATCH_SIZE else 'ALL'}")
    print(f"   🌐 Selenium: {'ENABLED ✅' if USE_SELENIUM else 'DISABLED ❌'}")
    print()
    
    # Run the scraper
    run_scraper(
        input_file=INPUT_FILE,
        output_file=OUTPUT_FILE,
        scrapers_to_use=SCRAPERS,
        batch_size=BATCH_SIZE,
        use_selenium=USE_SELENIUM
    )


if __name__ == "__main__":
    main()
