// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract DrivingLicense is ERC721 {
    uint256 private _nextTokenId;

    // store address of the required contract
    // we cannot have a driving licence without
    // a national ID first
    IERC721 public immutable nationalIdContract;

    // set the address of the National ID contract
    constructor(address _nationalIdAddress) ERC721("Driving License", "DL") {
        nationalIdContract = IERC721(_nationalIdAddress);
    }

    function mintLicense() public {
        
        // we must check that we don't already have a driving license
        require(balanceOf(msg.sender) == 0, "Already have a license");

        // we must also check that we have a national ID first
        require(nationalIdContract.balanceOf(msg.sender) > 0, "Must have National ID first!");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
    }
}