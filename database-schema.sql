-- Enhanced Database Schema for TOS System
-- Run this after creating the base database

USE Tos;

-- Update ItemManagement table to include all fields from the application
ALTER TABLE ItemManagement 
ADD COLUMN IF NOT EXISTS Price DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS CurrentStock INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS Image VARCHAR(500),
ADD COLUMN IF NOT EXISTS VendorID INT,
ADD COLUMN IF NOT EXISTS AvailableSizes TEXT,
ADD COLUMN IF NOT EXISTS AvailableColors TEXT,
ADD COLUMN IF NOT EXISTS CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD FOREIGN KEY (VendorID) REFERENCES VendorManagement(VendorID) ON DELETE SET NULL;

-- Create ItemVariants table for size/color combinations
CREATE TABLE IF NOT EXISTS ItemVariants (
    VariantID INT AUTO_INCREMENT PRIMARY KEY,
    SKUCode VARCHAR(20) NOT NULL,
    Color VARCHAR(50),
    Size VARCHAR(50),
    Quantity INT DEFAULT 0,
    Image VARCHAR(500),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SKUCode) REFERENCES ItemManagement(SKUCode) ON DELETE CASCADE,
    UNIQUE KEY unique_variant (SKUCode, Color, Size)
);

-- Update PurchaseRequisition to support multiple items per PR
ALTER TABLE PurchaseRequisition
ADD COLUMN IF NOT EXISTS RequestNo VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS RequestDate DATE,
ADD COLUMN IF NOT EXISTS Priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS Category VARCHAR(50),
ADD COLUMN IF NOT EXISTS Justification TEXT,
ADD COLUMN IF NOT EXISTS Remarks TEXT,
ADD COLUMN IF NOT EXISTS ApprovalDate DATE,
ADD COLUMN IF NOT EXISTS ApprovedBy VARCHAR(100),
ADD COLUMN IF NOT EXISTS TotalItems INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS EstimatedTotal DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS SelectedColor VARCHAR(50),
ADD COLUMN IF NOT EXISTS SelectedSize VARCHAR(50);

-- Create PRItems table to support multiple items per PR
CREATE TABLE IF NOT EXISTS PRItems (
    PRItemID INT AUTO_INCREMENT PRIMARY KEY,
    RequestNum INT NOT NULL,
    SKUCode VARCHAR(20) NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    Total DECIMAL(12,2) NOT NULL,
    SelectedColor VARCHAR(50),
    SelectedSize VARCHAR(50),
    FOREIGN KEY (RequestNum) REFERENCES PurchaseRequisition(RequestNum) ON DELETE CASCADE,
    FOREIGN KEY (SKUCode) REFERENCES ItemManagement(SKUCode) ON DELETE CASCADE
);

-- Update PurchaseOrder to support multiple items per PO
ALTER TABLE PurchaseOrder
ADD COLUMN IF NOT EXISTS OrderDate DATE,
ADD COLUMN IF NOT EXISTS RequestNum INT,
ADD COLUMN IF NOT EXISTS TotalItems INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS TotalAmount DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS SelectedColor VARCHAR(50),
ADD COLUMN IF NOT EXISTS SelectedSize VARCHAR(50),
ADD FOREIGN KEY (RequestNum) REFERENCES PurchaseRequisition(RequestNum) ON DELETE SET NULL;

-- Create POItems table to support multiple items per PO
CREATE TABLE IF NOT EXISTS POItems (
    POItemID INT AUTO_INCREMENT PRIMARY KEY,
    OrderNum INT NOT NULL,
    SKUCode VARCHAR(20) NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    Total DECIMAL(12,2) NOT NULL,
    SelectedColor VARCHAR(50),
    SelectedSize VARCHAR(50),
    FOREIGN KEY (OrderNum) REFERENCES PurchaseOrder(OrderNum) ON DELETE CASCADE,
    FOREIGN KEY (SKUCode) REFERENCES ItemManagement(SKUCode) ON DELETE CASCADE
);

-- Create Cart table for shopping cart
CREATE TABLE IF NOT EXISTS Cart (
    CartID INT AUTO_INCREMENT PRIMARY KEY,
    UserEmail VARCHAR(100) NOT NULL,
    SKUCode VARCHAR(20) NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    SelectedColor VARCHAR(50),
    SelectedSize VARCHAR(50),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SKUCode) REFERENCES ItemManagement(SKUCode) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (UserEmail, SKUCode, SelectedColor, SelectedSize)
);

-- Create Sizes table
CREATE TABLE IF NOT EXISTS Sizes (
    SizeID INT AUTO_INCREMENT PRIMARY KEY,
    SizeName VARCHAR(50) UNIQUE NOT NULL,
    Description TEXT,
    DefaultQuantity INT DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Colors table
CREATE TABLE IF NOT EXISTS Colors (
    ColorID INT AUTO_INCREMENT PRIMARY KEY,
    ColorName VARCHAR(50) UNIQUE NOT NULL,
    HexCode VARCHAR(7),
    Description TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Users table for authentication
CREATE TABLE IF NOT EXISTS Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role VARCHAR(50) NOT NULL,
    Department VARCHAR(50),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Favorites table
CREATE TABLE IF NOT EXISTS Favorites (
    FavoriteID INT AUTO_INCREMENT PRIMARY KEY,
    UserEmail VARCHAR(100) NOT NULL,
    SKUCode VARCHAR(20) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SKUCode) REFERENCES ItemManagement(SKUCode) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (UserEmail, SKUCode)
);

-- Add indexes for better performance
CREATE INDEX idx_item_category ON ItemManagement(Category);
CREATE INDEX idx_item_vendor ON ItemManagement(VendorID);
CREATE INDEX idx_pr_status ON PurchaseRequisition(Status);
CREATE INDEX idx_po_status ON PurchaseOrder(Status);
CREATE INDEX idx_cart_user ON Cart(UserEmail);
CREATE INDEX idx_inventory_sku ON Inventory(SKUCode);
