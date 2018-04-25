<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Musteri_Model extends CI_Model {

	function __construct()
	{
		parent :: __construct();
		
		
	} 
	public function login($email,$sifre)
	{		
		
		$this->db->select('*');
		$this->db->from('musteriler');
		$this->db->where('email', $email);
		$this->db->where('sifre', $sifre);
		$this->db->limit(1);
		
		
	
		  $query = $this->db->get();
        if ($query->num_rows()==1){
            return $query->result();
        }
        else {
            return false;
        }
		
	}
	public function update_data($tablo,$data,$id){
		$this->db->where('id',$id);
		$this->db->update($tablo,$data);
		return true;
	}
	
	}	


