<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class KullanicilarEkle extends CI_Controller {

	function __construct()
	{
		parent :: __construct();
		$this->load->library('session');
		if(! $this->session->userdata('oturum_data')){
		redirect(base_url().'admin/login');}
		
		$this->load->helper('url');
		$this->load->library('session');
		$this->load->database();
		$this->load->model('Database_Model');
	} 
	public function index()
	{		
		$query=$this->db->get("kullanicilar");
		$data["veri"]=$query->result();
		$data['sayfa']='Kullanıcı Ekle' ;	
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/kullanici_ekle');
		$this->load->view('admin/footer');
		
		
	}
	public function kaydet()
	{		
		$data=array(
			'adiSoyadi'   => $this->input->post('adiSoyadi'),
			'email' => $this->input->post('email'),
			'sifre' => $this->input->post('sifre'),
			'yetki' => $this->input->post('yetki'),
			'durum' => $this->input->post('durum'),
			'resim' => $this->input->post('resim')
			);
			$this->Database_Model->insert_data("kullanicilar",$data);
			$this->session->set_flashdata('sonuc','Kullanıcı ekleme işlemi başarılıdır!');
			redirect (base_url()."admin/kullanicilar");
			
		
		
	}
	
}
