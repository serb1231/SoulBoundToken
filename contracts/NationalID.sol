// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.5.0
pragma solidity ^0.8.27;

// this is for delegating an vote to an account. Didn't implement, is an artefact
// that should be deleted
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
// gives us balanceOf, ownerOf, transferFrom
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// not used currently, maybe for the future, for somebody to be able to burn their identity (move to romania)
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
// future functionality, for getting all the accounts in the future
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
// not used yet, for pausing a contract
import {ERC721Pausable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
// not used, maybe for the future, to ensure that if we have an ID today and vote, but destroy it tmr
// history will not count our vote
import {ERC721Votes} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
// for defining that only the oner can modify something (keyword onlyOwner)
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NationalID is ERC721, ERC721Enumerable, ERC721Pausable, Ownable, ERC721Burnable, EIP712, ERC721Votes {
    uint256 private _nextTokenId;

    constructor(address initialOwner)
        ERC721("NationalID", "MTK")
        Ownable(initialOwner)
        EIP712("NationalID", "1")
    {}
//fuzzing, formal verification, mutation testing. Interaction through CLI, frontend. Security testing (look on the internet how other protocols did). 
// in a system like this, what should I do..

    function _baseURI() internal pure override returns (string memory) {
        return "https://example.com/";
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(address to) public onlyOwner returns (uint256) {
        require(balanceOf(to) == 0, "Identity: User already has a token!");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable, ERC721Pausable, ERC721Votes)
        returns (address)
    {
        // get the current owner
        address from = _ownerOf(tokenId);

        
        // if owner is 0, we are minting. If receiver is 0, we are burning.
        // otherwise, it is a transfer, and we hate it.
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: Transfer failed");
        }

        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable, ERC721Votes)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
